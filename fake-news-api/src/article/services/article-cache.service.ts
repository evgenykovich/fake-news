import { Injectable, Logger } from '@nestjs/common';
import { ArticleResponse } from '../../interfaces/Article';
import { NewsCategory } from '../../interfaces/Categories';
import { MetricsService } from '../../monitoring/metrics.service';

interface CacheEntry {
  data: ArticleResponse;
  timestamp: number;
}

@Injectable()
export class ArticleCacheService {
  private readonly logger = new Logger(ArticleCacheService.name);
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(private readonly metricsService: MetricsService) {}

  private createCacheKey(category: NewsCategory, sourceId?: string): string {
    return `${category}${sourceId ? `:${sourceId}` : ''}`;
  }

  setCached(
    category: NewsCategory,
    data: ArticleResponse,
    sourceId?: string,
  ): void {
    const key = this.createCacheKey(category, sourceId);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.logger.debug(`Cached articles for ${key}`);
    this.metricsService.incrementCacheHits(category);
  }

  getCached(category: NewsCategory, sourceId?: string): ArticleResponse | null {
    const key = this.createCacheKey(category, sourceId);
    const cached = this.cache.get(key);
    const now = Date.now();

    if (!cached) {
      this.logger.debug(`Cache miss for ${key}`);
      this.metricsService.incrementCacheMisses(category);
      return null;
    }

    if (now - cached.timestamp > this.CACHE_TTL) {
      this.logger.debug(`Cache expired for ${key}`);
      this.metricsService.incrementCacheEvictions(category);
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit for ${key}`);
    this.metricsService.incrementCacheHits(category);
    return cached.data;
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  clearCategoryCache(category: NewsCategory): void {
    for (const [key] of this.cache) {
      if (key.startsWith(category)) {
        this.cache.delete(key);
        this.logger.debug(`Cleared cache for ${key}`);
      }
    }
  }
}
