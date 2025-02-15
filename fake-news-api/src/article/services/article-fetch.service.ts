import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsCategory } from '../../interfaces/Categories';
import { ArticleResponse } from '../../interfaces/Article';
import { ExternalAPIException } from '../exceptions/external-api.exception';
import { MetricsService } from '../../monitoring/metrics.service';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

@Injectable()
export class ArticleFetchService {
  private readonly logger = new Logger(ArticleFetchService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.baseUrl = this.configService.get<string>('NEWS_API_URL');
    this.apiKey = this.configService.get<string>('NEWS_API_KEY');
  }

  async fetchArticles(category: NewsCategory): Promise<ArticleResponse> {
    return this.circuitBreaker.executeWithBreaker('newsapi', async () => {
      try {
        const url = `${this.baseUrl}/top-headlines?category=${category}&apiKey=${this.apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          this.metricsService.incrementExternalApiRequests('newsapi', false);
          throw new ExternalAPIException(`NewsAPI error: ${error.message}`);
        }

        const data = await response.json();
        this.metricsService.incrementExternalApiRequests('newsapi', true);
        this.logger.log(
          `Successfully fetched ${data.articles.length} articles for ${category}`,
        );
        return data;
      } catch (error) {
        this.logger.error(`Failed to fetch articles: ${error.message}`);
        this.metricsService.incrementExternalApiRequests('newsapi', false);
        throw new ExternalAPIException(error.message);
      }
    });
  }
}
