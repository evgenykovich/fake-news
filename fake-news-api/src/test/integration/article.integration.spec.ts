import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from '../../article/article.service';
import { ArticleCacheService } from '../../article/services/article-cache.service';
import { ArticleEnrichmentService } from '../../article/services/article-enrichment.service';
import { NewsCategory } from '../../interfaces/Categories';
import { NewsSourceRegistry } from '../../news-sources/news-source.registry';
import { ArticleQueueService } from '../../queue/article-queue.service';
import { NewsSource } from '../../interfaces/news-source.interface';
import { mockArticle } from '../test-utils';

describe('Article Integration', () => {
  let moduleRef: TestingModule;
  let articleService: ArticleService;
  let cacheService: ArticleCacheService;
  let enrichmentService: ArticleEnrichmentService;
  let newsSourceRegistry: NewsSourceRegistry;

  beforeEach(async () => {
    const mockCacheService = {
      getCached: jest.fn().mockReturnValue(null),
      setCached: jest.fn(),
    };

    const mockEnrichmentService = {
      enrichArticles: jest.fn().mockImplementation((articles) =>
        articles.map((article) => ({
          ...article,
          fake_title: 'Mocked Satirical Title',
          enrichmentStatus: 'completed',
        })),
      ),
      getEnrichedArticle: jest.fn().mockImplementation((id) => ({
        ...mockArticle,
        id,
        fake_title: 'Mocked Satirical Title',
        enrichmentStatus: 'completed',
      })),
      getEnrichmentStatus: jest
        .fn()
        .mockImplementation(
          (ids) => new Map(ids.map((id) => [id, 'completed'])),
        ),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleCacheService,
          useValue: mockCacheService,
        },
        {
          provide: NewsSourceRegistry,
          useValue: {
            getSource: jest.fn(),
            getAvailableSources: jest.fn(),
          },
        },
        {
          provide: ArticleEnrichmentService,
          useValue: mockEnrichmentService,
        },
        {
          provide: ArticleQueueService,
          useValue: {
            onArticleEnriched: jest.fn(),
            onArticleEnrichmentFailed: jest.fn(),
            addToQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    articleService = moduleRef.get<ArticleService>(ArticleService);
    cacheService = moduleRef.get<ArticleCacheService>(ArticleCacheService);
    enrichmentService = moduleRef.get<ArticleEnrichmentService>(
      ArticleEnrichmentService,
    );
    newsSourceRegistry = moduleRef.get<NewsSourceRegistry>(NewsSourceRegistry);
  });

  describe('Article Flow', () => {
    it('should fetch, enrich, and cache articles from a source', async () => {
      const mockNewsSource: NewsSource = {
        id: 'test-source',
        name: 'Test Source',
        baseUrl: 'https://test.com',
        priority: 1,
        isAvailable: jest.fn().mockResolvedValue(true),
        getHealth: jest.fn().mockResolvedValue({ status: 'healthy' }),
        fetchArticles: jest.fn().mockResolvedValue({
          articles: [mockArticle],
          totalResults: 1,
          status: 'ok',
        }),
      };

      jest
        .spyOn(newsSourceRegistry, 'getAvailableSources')
        .mockResolvedValue([mockNewsSource]);

      jest
        .spyOn(newsSourceRegistry, 'getSource')
        .mockReturnValue(mockNewsSource);

      const result = await articleService.getAllArticles(NewsCategory.GENERAL);

      expect(newsSourceRegistry.getAvailableSources).toHaveBeenCalled();
      expect(mockNewsSource.fetchArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
      expect(enrichmentService.enrichArticles).toHaveBeenCalledWith([
        mockArticle,
      ]);
      expect(cacheService.setCached).toHaveBeenCalled();
      expect(result.articles[0].fake_title).toBe('Mocked Satirical Title');
    });

    it('should return cached articles when available', async () => {
      const cachedResponse = {
        articles: [
          {
            ...mockArticle,
            fake_title: 'Cached Satirical Title',
          },
        ],
        totalResults: 1,
        status: 'ok',
      };

      jest.spyOn(cacheService, 'getCached').mockReturnValue(cachedResponse);

      const result = await articleService.getAllArticles(NewsCategory.GENERAL);

      expect(result).toEqual(cachedResponse);
      expect(newsSourceRegistry.getSource).not.toHaveBeenCalled();
      expect(enrichmentService.enrichArticles).not.toHaveBeenCalled();
    });

    it('should handle source fetch errors', async () => {
      const mockNewsSource: NewsSource = {
        id: 'test-source',
        name: 'Test Source',
        baseUrl: 'https://test.com',
        priority: 1,
        isAvailable: jest.fn().mockResolvedValue(true),
        getHealth: jest.fn().mockResolvedValue({ status: 'healthy' }),
        fetchArticles: jest.fn().mockRejectedValue(new Error('API Error')),
      };

      const sourceId = 'test-source';
      jest
        .spyOn(newsSourceRegistry, 'getSource')
        .mockReturnValue(mockNewsSource);

      await expect(
        articleService.getAllArticles(NewsCategory.GENERAL, sourceId),
      ).rejects.toThrow('API Error');

      expect(mockNewsSource.fetchArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
    });
  });
});
