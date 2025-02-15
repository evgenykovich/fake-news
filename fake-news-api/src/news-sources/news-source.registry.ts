import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NewsSource } from '../interfaces/news-source.interface';
import { NewsAPISource } from './implementations/newsapi.source';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class NewsSourceRegistry implements OnModuleInit {
  private readonly logger = new Logger(NewsSourceRegistry.name);
  private sources: Map<string, NewsSource> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    try {
      const newsAPISource = new NewsAPISource(
        this.configService,
        this.circuitBreaker,
        this.metricsService,
      );
      this.registerSource(newsAPISource);

      const sourcesCount = this.sources.size;
      this.logger.log(`Initialized ${sourcesCount} news sources`);

      if (sourcesCount === 0) {
        this.logger.error('No news sources were initialized');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize news sources: ${error.message}`);
      throw error;
    }
  }

  registerSource(source: NewsSource) {
    this.sources.set(source.id, source);
    this.logger.log(`Registered news source: ${source.name}`);
  }

  getSource(sourceId: string): NewsSource {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`News source not found: ${sourceId}`);
    }
    return source;
  }

  async getAvailableSources(): Promise<NewsSource[]> {
    const healthySources = await this.getHealthySources();
    if (healthySources.length === 0) {
      this.logger.error('No healthy news sources available');
      throw new Error('No news sources available');
    }
    return healthySources;
  }

  async getHealthySources(): Promise<NewsSource[]> {
    const healthySourcesPromises = Array.from(this.sources.values()).map(
      async (source) => {
        try {
          const health = await source.getHealth();
          return health.status === 'healthy' ? source : null;
        } catch (error) {
          this.logger.error(
            `Failed to get health for source ${source.name}: ${error.message}`,
          );
          return null;
        }
      },
    );

    const healthySources = (await Promise.all(healthySourcesPromises)).filter(
      (source): source is NewsSource => source !== null,
    );

    this.logger.debug(
      `Found ${healthySources.length} healthy sources out of ${
        this.sources.size
      } total sources`,
    );

    return healthySources;
  }

  getAllSources(): NewsSource[] {
    return Array.from(this.sources.values());
  }
}
