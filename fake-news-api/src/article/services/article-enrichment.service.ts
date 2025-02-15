import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { ArticleQueueService } from '../../queue/article-queue.service';
import { EnrichmentException } from '../exceptions/enrichment.exception';
import { Article } from '../../interfaces/Article';

type EnrichmentStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class ArticleEnrichmentService {
  private readonly logger = new Logger(ArticleEnrichmentService.name);
  private enrichedArticles = new Map<string, Article>();

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly queueService: ArticleQueueService,
  ) {
    this.queueService.onArticleEnriched((article: Article) => {
      this.enrichedArticles.set(article.id, article);
    });
  }

  async enrichArticle(article: Article): Promise<Article> {
    try {
      const cached = this.enrichedArticles.get(article.id);
      if (cached) {
        return cached;
      }

      const enriched = await this.openAIService.enrichArticle(article);

      const enrichedArticle: Article = {
        ...article,
        enrichmentStatus: 'completed' as EnrichmentStatus,
        fake_title: enriched.fake_title,
      };

      this.enrichedArticles.set(article.id, enrichedArticle);
      return enrichedArticle;
    } catch (error) {
      this.logger.error(`Failed to enrich article: ${error.message}`);
      const failedArticle: Article = {
        ...article,
        enrichmentStatus: 'failed' as EnrichmentStatus,
      };
      this.enrichedArticles.set(article.id, failedArticle);
      throw new EnrichmentException(error.message);
    }
  }

  async enrichArticles(articles: Article[]): Promise<Article[]> {
    try {
      const results = await Promise.all(
        articles.map(async (article) => {
          const cached = this.enrichedArticles.get(article.id);
          if (cached) {
            return cached;
          }

          const enriched = await this.openAIService.enrichArticle(article);
          const enrichedArticle: Article = {
            ...article,
            enrichmentStatus: 'completed' as EnrichmentStatus,
            fake_title: enriched.fake_title,
          };

          this.enrichedArticles.set(article.id, enrichedArticle);
          return enrichedArticle;
        }),
      );

      return results;
    } catch (error) {
      this.logger.error(`Failed to enrich articles: ${error.message}`);
      throw new EnrichmentException(error.message);
    }
  }

  getEnrichedArticle(articleId: string): Article | undefined {
    return this.enrichedArticles.get(articleId);
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
