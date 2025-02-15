import { Logger } from '@nestjs/common';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../monitoring/metrics.service';
import {
  NewsSource,
  NewsSourceConfig,
  NewsSourceHealth,
} from '../interfaces/news-source.interface';
import { ArticleResponse } from '../interfaces/Article';
import { NewsCategory } from '../interfaces/Categories';

export abstract class BaseNewsSource implements NewsSource {
  protected readonly logger: Logger;
  private currentHealth: NewsSourceHealth = {
    status: 'healthy',
    lastCheck: new Date(),
    failureCount: 0,
    responseTime: 0,
    rateLimitRemaining: 0,
  };
  private requestTimestamps: number[] = [];

  constructor(
    protected readonly config: NewsSourceConfig,
    protected readonly circuitBreaker: CircuitBreakerService,
    protected readonly metricsService: MetricsService,
  ) {
    if (!this.isValidConfig(config)) {
      throw new Error(
        `Invalid configuration for news source ${config.name || 'unknown'}`,
      );
    }
    this.logger = new Logger(this.constructor.name);
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get priority(): number {
    return this.config.priority;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.circuitBreaker.executeWithBreaker(`${this.id}-health`, () =>
        this.healthCheck(),
      );
      return (
        this.currentHealth.status === 'healthy' &&
        this.currentHealth.rateLimitRemaining > 0
      );
    } catch (error) {
      this.logger.error(
        `Health check failed for ${this.name}: ${error.message}`,
      );
      return false;
    }
  }

  private isValidConfig(config: NewsSourceConfig): boolean {
    return !!(
      config.id &&
      config.name &&
      config.baseUrl &&
      config.apiKey &&
      config.priority >= 0 &&
      config.rateLimits
    );
  }

  protected async executeWithRateLimit<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    this.cleanupOldRequests(now);

    if (this.isRateLimitExceeded(now)) {
      throw new Error(`Rate limit exceeded for ${this.name}`);
    }

    const startTime = process.hrtime();
    try {
      const result = await operation();
      this.updateHealthStatus(true);
      return result;
    } catch (error) {
      this.updateHealthStatus(false);
      throw error;
    }
  }

  private cleanupOldRequests(now: number) {
    const oneMinuteAgo = now - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo,
    );
  }

  private isRateLimitExceeded(now: number): boolean {
    if (
      this.requestTimestamps.length >= this.config.rateLimits.requestsPerMinute
    ) {
      return true;
    }
    this.requestTimestamps.push(now);
    this.currentHealth.rateLimitRemaining =
      this.config.rateLimits.requestsPerMinute - this.requestTimestamps.length;
    return false;
  }

  private updateHealthStatus(success: boolean) {
    const now = new Date();
    const [seconds, nanoseconds] = process.hrtime();
    const responseTime = seconds * 1000 + nanoseconds / 1000000;

    if (!success) {
      this.currentHealth.failureCount++;
      if (this.currentHealth.failureCount >= 3) {
        this.currentHealth.status = 'down';
      } else if (this.currentHealth.failureCount >= 1) {
        this.currentHealth.status = 'degraded';
      }
    } else {
      this.currentHealth.failureCount = 0;
      this.currentHealth.status = 'healthy';
    }

    this.currentHealth.lastCheck = now;
    this.currentHealth.responseTime = responseTime;
  }

  async getHealth(): Promise<NewsSourceHealth> {
    return this.currentHealth;
  }

  abstract fetchArticles(category: NewsCategory): Promise<ArticleResponse>;

  abstract healthCheck(): Promise<NewsSourceHealth>;

  protected setHealth(health: NewsSourceHealth): void {
    this.currentHealth = health;
  }
}
