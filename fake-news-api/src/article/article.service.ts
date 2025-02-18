import { Injectable, Logger } from '@nestjs/common';
import { Article, ArticleResponse } from '../interfaces/Article';
import { NewsCategory } from '../interfaces/Categories';
import { IArticleService } from '../interfaces/IArticleService';
import { ArticleCacheService } from './services/article-cache.service';
import { NewsSourceRegistry } from '../news-sources/news-source.registry';
import { ArticleEnrichmentService } from './services/article-enrichment.service';
import { ArticleNotFoundException } from './exceptions/article-not-found.exception';

@Injectable()
export class ArticleService implements IArticleService {
  private readonly logger = new Logger(ArticleService.name);
  private readonly MAX_WAIT_TIME = 10000; // 10 seconds
  private readonly POLL_INTERVAL = 500; // 0.5 seconds

  constructor(
    private readonly cacheService: ArticleCacheService,
    private readonly newsSourceRegistry: NewsSourceRegistry,
    private readonly enrichmentService: ArticleEnrichmentService,
  ) {}

  async getAllArticles(
    category: NewsCategory,
    sourceId?: string,
  ): Promise<ArticleResponse> {
    try {
      this.logger.debug(`Fetching articles for category: ${category}`);

      const cached = this.cacheService.getCached(category, sourceId);
      if (cached) {
        this.logger.debug(
          `Returning ${cached.articles.length} cached articles for ${category}`,
        );
        return cached;
      }

      let articles: ArticleResponse;
      if (sourceId) {
        const source = this.newsSourceRegistry.getSource(sourceId);
        articles = await source.fetchArticles(category);
      } else {
        articles = await this.fetchFromAllSources(category);
      }

      this.logger.debug(
        `Fetched ${articles.articles.length} raw articles for ${category}`,
      );

      const enrichedArticles = await this.enrichmentService.enrichArticles(
        articles.articles,
      );

      const startTime = Date.now();
      while (Date.now() - startTime < this.MAX_WAIT_TIME) {
        const statuses = await this.enrichmentService.getEnrichmentStatus(
          enrichedArticles.map((a) => a.id),
        );

        const allCompleted = Array.from(statuses.values()).every(
          (status) => status === 'completed' || status === 'failed',
        );

        if (allCompleted) {
          const finalArticles = enrichedArticles.map((article) => {
            const enriched = this.enrichmentService.getEnrichedArticle(
              article.id,
            );
            return enriched || article;
          });

          const enrichedResponse = {
            ...articles,
            articles: finalArticles,
          };

          this.cacheService.setCached(category, enrichedResponse, sourceId);

          this.logger.debug(
            `Returning ${finalArticles.length} enriched articles for ${category}`,
          );

          return enrichedResponse;
        }

        await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
      }

      this.logger.warn(
        `Enrichment timeout reached for ${category}, returning partially enriched articles`,
      );

      const timeoutResponse: ArticleResponse = {
        ...articles,
        articles: enrichedArticles.map((article) => {
          const enriched = this.enrichmentService.getEnrichedArticle(
            article.id,
          );
          return (
            enriched || {
              ...article,
              enrichmentStatus: 'failed' as const,
            }
          );
        }),
      };

      return timeoutResponse;
    } catch (error) {
      this.logger.error(`Failed to get articles: ${error.message}`);
      throw error;
    }
  }

  async getArticleById(category: NewsCategory, id: string): Promise<Article> {
    try {
      const response = await this.getAllArticles(category);
      const index = parseInt(id);

      this.logger.debug(
        `Getting article at index ${index} from ${response.articles.length} articles for ${category}`,
      );

      if (isNaN(index) || index < 0 || index >= response.articles.length) {
        this.logger.warn(
          `Invalid article index: ${id}, total articles: ${response.articles.length}`,
        );
        throw new ArticleNotFoundException(id);
      }

      const article = response.articles[index];

      if (!article) {
        this.logger.warn(`No article found at index: ${index}`);
        throw new ArticleNotFoundException(id);
      }

      return article;
    } catch (error) {
      if (error instanceof ArticleNotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get article by id: ${error.message}`);
      throw new ArticleNotFoundException(id);
    }
  }

  private async fetchFromAllSources(
    category: NewsCategory,
  ): Promise<ArticleResponse> {
    const sources = await this.newsSourceRegistry.getAvailableSources();
    this.logger.debug(
      `Fetching from ${sources.length} sources for ${category}`,
    );

    const results = await Promise.allSettled(
      sources.map((source) => source.fetchArticles(category)),
    );

    const successfulResults = results
      .filter(
        (result): result is PromiseFulfilledResult<ArticleResponse> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      throw new Error('No news sources available');
    }

    const allArticles = successfulResults.flatMap((result) => result.articles);

    const uniqueArticles = Array.from(
      new Map(
        allArticles.map((article) => [
          `${article.title}-${article.publishedAt}-${article.url}`,
          article,
        ]),
      ).values(),
    );

    this.logger.debug(
      `Fetched ${allArticles.length} total articles, deduplicated to ${uniqueArticles.length} for ${category}`,
    );

    return {
      status: 'ok',
      totalResults: uniqueArticles.length,
      articles: uniqueArticles,
    };
  }
}
