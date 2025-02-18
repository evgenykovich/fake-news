import { Test, TestingModule } from '@nestjs/testing';
import { ArticleCacheService } from './article-cache.service';
import { NewsCategory } from '../../interfaces/Categories';
import { mockArticleResponse } from '../../test/test-utils';
import { mockMetricsService } from '../../test/mocks/metrics.service.mock';
import { MetricsService } from '../../monitoring/metrics.service';

describe('ArticleCacheService', () => {
  let service: ArticleCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleCacheService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<ArticleCacheService>(ArticleCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cache operations', () => {
    it('should return null for non-cached category', () => {
      const result = service.getCached(NewsCategory.GENERAL);
      expect(result).toBeNull();
      expect(mockMetricsService.incrementCacheMisses).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
    });

    it('should store and retrieve cached data', () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: mockArticleResponse.articles.map((article) => ({
          ...article,
          enrichmentStatus: 'completed' as const,
        })),
      };

      service.setCached(NewsCategory.GENERAL, enrichedResponse);
      const result = service.getCached(NewsCategory.GENERAL);

      expect(result).toEqual(enrichedResponse);
      expect(mockMetricsService.incrementCacheHits).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
    });

    it('should handle source-specific caching', () => {
      const sourceId = 'test-source';
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: mockArticleResponse.articles.map((article) => ({
          ...article,
          enrichmentStatus: 'completed' as const,
        })),
      };

      service.setCached(NewsCategory.GENERAL, enrichedResponse, sourceId);

      expect(service.getCached(NewsCategory.GENERAL, sourceId)).toEqual(
        enrichedResponse,
      );

      expect(
        service.getCached(NewsCategory.GENERAL, 'different-source'),
      ).toBeNull();

      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
    });

    it('should return null for expired cache', async () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: mockArticleResponse.articles.map((article) => ({
          ...article,
          enrichmentStatus: 'completed' as const,
        })),
      };

      service.setCached(NewsCategory.GENERAL, enrichedResponse);

      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 300001);

      const result = service.getCached(NewsCategory.GENERAL);
      expect(result).toBeNull();
      expect(mockMetricsService.incrementCacheEvictions).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );

      Date.now = originalNow;
    });

    it('should properly clear cache', () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: mockArticleResponse.articles.map((article) => ({
          ...article,
          enrichmentStatus: 'completed' as const,
        })),
      };

      service.setCached(NewsCategory.GENERAL, enrichedResponse);
      service.setCached(NewsCategory.BUSINESS, enrichedResponse);

      service.clearCategoryCache(NewsCategory.GENERAL);
      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
      expect(service.getCached(NewsCategory.BUSINESS)).not.toBeNull();

      service.clearCache();
      expect(service.getCached(NewsCategory.BUSINESS)).toBeNull();
    });

    it('should clear all entries for a category including source-specific ones', () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: mockArticleResponse.articles.map((article) => ({
          ...article,
          enrichmentStatus: 'completed' as const,
        })),
      };

      service.setCached(NewsCategory.GENERAL, enrichedResponse);
      service.setCached(NewsCategory.GENERAL, enrichedResponse, 'source1');
      service.setCached(NewsCategory.GENERAL, enrichedResponse, 'source2');
      service.setCached(NewsCategory.BUSINESS, enrichedResponse);

      service.clearCategoryCache(NewsCategory.GENERAL);

      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
      expect(service.getCached(NewsCategory.GENERAL, 'source1')).toBeNull();
      expect(service.getCached(NewsCategory.GENERAL, 'source2')).toBeNull();
      expect(service.getCached(NewsCategory.BUSINESS)).not.toBeNull();
    });
  });
});
