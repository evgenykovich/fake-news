import { Injectable, Logger } from '@nestjs/common';
import { ArticleQueueService } from '../../queue/article-queue.service';
import { EnrichmentException } from '../exceptions/enrichment.exception';
import { Article } from '../../interfaces/Article';

type EnrichmentStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class ArticleEnrichmentService {
  private readonly logger = new Logger(ArticleEnrichmentService.name);
  private enrichedArticles = new Map<string, Article>();

  constructor(private readonly queueService: ArticleQueueService) {
    this.queueService.onArticleEnriched((article: Article) => {
      this.logger.debug(
        `Received enriched article ${article.id}: ${article.fake_title}`,
      );
      this.enrichedArticles.set(article.id, article);
    });

    this.queueService.onArticleEnrichmentFailed((article: Article) => {
      this.logger.debug(`Received failed article ${article.id}`);
      this.enrichedArticles.set(article.id, {
        ...article,
        enrichmentStatus: 'failed',
      });
    });
  }

  async enrichArticle(article: Article): Promise<Article> {
    try {
      const cached = this.enrichedArticles.get(article.id);
      if (cached) {
        return cached;
      }

      await this.queueService.addToQueue([article]);

      return {
        ...article,
        enrichmentStatus: 'pending',
      };
    } catch (error) {
      this.logger.error(`Failed to enrich article: ${error.message}`);
      throw new EnrichmentException(error.message);
    }
  }

  async enrichArticles(articles: Article[]): Promise<Article[]> {
    try {
      if (articles.length === 0) {
        return [];
      }

      const results = articles.map((article) => {
        const cached = this.enrichedArticles.get(article.id);
        if (cached) {
          return cached;
        }
        return {
          ...article,
          enrichmentStatus: 'pending' as const,
        };
      });

      const nonCachedArticles = articles.filter(
        (article) => !this.enrichedArticles.has(article.id),
      );

      if (nonCachedArticles.length > 0) {
        await this.queueService.addToQueue(nonCachedArticles);
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to enrich articles: ${error.message}`);
      throw new EnrichmentException(error.message);
    }
  }

  getEnrichedArticle(articleId: string): Article | undefined {
    const article = this.enrichedArticles.get(articleId);
    this.logger.debug(
      `Getting enriched article ${articleId}: ${article?.fake_title || 'not found'}`,
    );
    return article;
  }

  async getEnrichmentStatus(
    articleIds: string[],
  ): Promise<Map<string, EnrichmentStatus>> {
    return new Map(
      articleIds.map((id) => [
        id,
        this.enrichedArticles.has(id)
          ? ('completed' as EnrichmentStatus)
          : ('pending' as EnrichmentStatus),
      ]),
    );
  }
}
