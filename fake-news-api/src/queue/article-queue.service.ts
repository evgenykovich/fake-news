import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from '../openai/openai.service';
import { MetricsService } from '../monitoring/metrics.service';
import { Article } from '../interfaces/Article';

type EnrichmentStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class ArticleQueueService {
  private readonly logger = new Logger(ArticleQueueService.name);
  private queue: Article[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 5;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly metricsService: MetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addToQueue(articles: Article[]): Promise<void> {
    this.queue.push(...articles);
    this.metricsService.recordQueueSize(this.queue.length);
    this.logger.log(
      `Added ${articles.length} articles to queue. Queue size: ${this.queue.length}`,
    );
  }

  onArticleEnriched(callback: (article: Article) => void) {
    this.eventEmitter.on('article.enriched', callback);
    return () => this.eventEmitter.off('article.enriched', callback);
  }

  onArticleEnrichmentFailed(callback: (articleId: string) => void) {
    this.eventEmitter.on('article.enrichment.failed', callback);
    return () => this.eventEmitter.off('article.enrichment.failed', callback);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      setTimeout(() => this.processQueue(), 100);
      return;
    }

    this.isProcessing = true;
    try {
      const batch = this.queue.splice(0, this.BATCH_SIZE);
      const startTime = Date.now();

      for (const article of batch) {
        try {
          const enriched = await this.openAIService.enrichArticle(article);
          const enrichedArticle: Article = {
            ...article,
            enrichmentStatus: 'completed' as const,
            fake_title: enriched.fake_title,
          };
          this.eventEmitter.emit('article.enriched', enrichedArticle);
          this.logger.debug(
            `Enriched article ${article.id} with fake title: ${enriched.fake_title}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to enrich article ${article.id}: ${error.message}`,
          );
          const failedArticle: Article = {
            ...article,
            enrichmentStatus: 'failed' as const,
          };
          this.eventEmitter.emit('article.enrichment.failed', failedArticle);
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordQueueProcessingTime(duration);
      this.metricsService.recordQueueSize(this.queue.length);
    } catch (error) {
      this.logger.error(`Queue processing error: ${error.message}`);
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 100);
    }
  }

  getQueueStatus(): { size: number; isProcessing: boolean } {
    return {
      size: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}
