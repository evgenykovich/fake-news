import { Injectable, Logger } from '@nestjs/common';
import { NewsSourceRegistry } from '../news-source.registry';
import { MetricsService } from '../../monitoring/metrics.service';
import { NewsSource } from '../../interfaces/news-source.interface';
import { NewsCategory } from '../../interfaces/Categories';

@Injectable()
export class SourceFallbackService {
  private readonly logger = new Logger(SourceFallbackService.name);

  constructor(
    private readonly sourceRegistry: NewsSourceRegistry,
    private readonly metricsService: MetricsService,
  ) {}

  async getFallbackSource(
    failedSource: NewsSource,
    category: NewsCategory,
  ): Promise<NewsSource | null> {
    try {
      const availableSources = await this.sourceRegistry.getHealthySources();

      const fallbackSources = availableSources
        .filter(
          (source) =>
            source.id !== failedSource.id &&
            source.priority > failedSource.priority,
        )
        .sort((a, b) => a.priority - b.priority);

      for (const source of fallbackSources) {
        const health = await source.getHealth();
        if (health.status === 'healthy' && health.rateLimitRemaining > 0) {
          this.logger.log(
            `Using ${source.name} as fallback for ${failedSource.name}`,
          );
          this.metricsService.incrementSourceFallback(
            failedSource.id,
            source.id,
          );
          return source;
        }
      }

      this.logger.warn(`No fallback source available for ${failedSource.name}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error finding fallback source: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
