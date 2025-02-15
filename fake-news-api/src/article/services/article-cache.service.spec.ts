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
      service.setCached(NewsCategory.GENERAL, mockArticleResponse);
      const result = service.getCached(NewsCategory.GENERAL);

      expect(result).toEqual(mockArticleResponse);
      expect(mockMetricsService.incrementCacheHits).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
    });

    it('should handle source-specific caching', () => {
      const sourceId = 'test-source';
      service.setCached(NewsCategory.GENERAL, mockArticleResponse, sourceId);

      // Should return data for correct source
      expect(service.getCached(NewsCategory.GENERAL, sourceId)).toEqual(
        mockArticleResponse,
      );

      // Should return null for same category but different source
      expect(
        service.getCached(NewsCategory.GENERAL, 'different-source'),
      ).toBeNull();

      // Should return null for same category without source
      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
    });

    it('should return null for expired cache', async () => {
      service.setCached(NewsCategory.GENERAL, mockArticleResponse);

      // Mock Date.now() to simulate cache expiration
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 300001); // Just over 5 minutes later

      const result = service.getCached(NewsCategory.GENERAL);
      expect(result).toBeNull();
      expect(mockMetricsService.incrementCacheEvictions).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );

      Date.now = originalNow; // Restore original Date.now
    });

    it('should properly clear cache', () => {
      service.setCached(NewsCategory.GENERAL, mockArticleResponse);
      service.setCached(NewsCategory.BUSINESS, mockArticleResponse);

      service.clearCategoryCache(NewsCategory.GENERAL);
      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
      expect(service.getCached(NewsCategory.BUSINESS)).not.toBeNull();

      service.clearCache(); // Full cache clear
      expect(service.getCached(NewsCategory.BUSINESS)).toBeNull();
    });

    it('should clear all entries for a category including source-specific ones', () => {
      service.setCached(NewsCategory.GENERAL, mockArticleResponse);
      service.setCached(NewsCategory.GENERAL, mockArticleResponse, 'source1');
      service.setCached(NewsCategory.GENERAL, mockArticleResponse, 'source2');
      service.setCached(NewsCategory.BUSINESS, mockArticleResponse);

      service.clearCategoryCache(NewsCategory.GENERAL);

      expect(service.getCached(NewsCategory.GENERAL)).toBeNull();
      expect(service.getCached(NewsCategory.GENERAL, 'source1')).toBeNull();
      expect(service.getCached(NewsCategory.GENERAL, 'source2')).toBeNull();
      expect(service.getCached(NewsCategory.BUSINESS)).not.toBeNull();
    });
  });
});
