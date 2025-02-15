import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseNewsSource } from '../base-news.source';
import { NewsCategory } from '../../interfaces/Categories';
import { ArticleResponse } from '../../interfaces/Article';
import { ExternalAPIException } from '../../article/exceptions/external-api.exception';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../../monitoring/metrics.service';
import { NewsSourceHealth } from '../../interfaces/news-source.interface';

@Injectable()
export class NewsAPISource extends BaseNewsSource {
  constructor(
    configService: ConfigService,
    circuitBreaker: CircuitBreakerService,
    metricsService: MetricsService,
  ) {
    const config = {
      id: 'newsapi',
      name: 'News API',
      baseUrl:
        configService.get<string>('NEWS_API_URL') || 'https://newsapi.org/v2',
      apiKey: configService.get<string>('NEWS_API_KEY'),
      priority: 1,
      rateLimits: {
        requestsPerMinute:
          configService.get<number>('NEWS_API_RATE_LIMIT_PER_MINUTE') || 30,
        requestsPerDay:
          configService.get<number>('NEWS_API_RATE_LIMIT_PER_DAY') || 500,
      },
    };

    if (!config.apiKey) {
      throw new Error('NEWS_API_KEY environment variable is not set');
    }

    super(config, circuitBreaker, metricsService);
  }

  async healthCheck(): Promise<NewsSourceHealth> {
    try {
      const startTime = Date.now();
      const response = await fetch(
        `${this.config.baseUrl}/top-headlines?country=us&pageSize=1&apiKey=${this.config.apiKey}`,
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Health check failed: ${error.message}`);
        const health: NewsSourceHealth = {
          status: 'down',
          lastCheck: new Date(),
          failureCount: (await this.getHealth()).failureCount + 1,
          responseTime,
          rateLimitRemaining: 0,
        };
        this.setHealth(health);
        return health;
      }

      await response.json();
      const health: NewsSourceHealth = {
        status: 'healthy',
        lastCheck: new Date(),
        failureCount: 0,
        responseTime,
        rateLimitRemaining: this.config.rateLimits.requestsPerMinute,
      };
      this.setHealth(health);
      return health;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      const health: NewsSourceHealth = {
        status: 'down',
        lastCheck: new Date(),
        failureCount: (await this.getHealth()).failureCount + 1,
        responseTime: 0,
        rateLimitRemaining: 0,
      };
      this.setHealth(health);
      return health;
    }
  }

  async fetchArticles(category: NewsCategory): Promise<ArticleResponse> {
    return this.circuitBreaker.executeWithBreaker('newsapi', async () => {
      try {
        const url = `${this.config.baseUrl}/top-headlines?category=${category}&apiKey=${this.config.apiKey}&pageSize=20`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          this.metricsService.incrementExternalApiRequests('newsapi', false);
          throw new ExternalAPIException(`NewsAPI error: ${error.message}`);
        }

        const data = await response.json();

        const articles = data.articles.map((article: any, index: number) => ({
          id: `${category}-${index}`,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          urlToImage: article.urlToImage,
          source: article.source,
          author: article.author,
          publishedAt: article.publishedAt,
        }));

        const deduplicatedResponse = {
          status: 'ok',
          totalResults: articles.length,
          articles: articles,
        };

        this.metricsService.incrementExternalApiRequests('newsapi', true);
        this.logger.log(`Fetched ${articles.length} articles for ${category}`);

        return deduplicatedResponse;
      } catch (error) {
        this.logger.error(`Failed to fetch articles: ${error.message}`);
        this.metricsService.incrementExternalApiRequests('newsapi', false);
        throw new ExternalAPIException(error.message);
      }
    });
  }
}
