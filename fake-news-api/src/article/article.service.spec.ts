import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { ArticleCacheService } from './services/article-cache.service';
import { ArticleEnrichmentService } from './services/article-enrichment.service';
import { NewsSourceRegistry } from '../news-sources/news-source.registry';
import { ArticleNotFoundException } from './exceptions/article-not-found.exception';
import { mockArticleResponse, mockEnrichedArticle } from '../test/test-utils';
import { NewsCategory } from '../interfaces/Categories';

describe('ArticleService', () => {
  let service: ArticleService;
  let cacheService: ArticleCacheService;
  let enrichmentService: ArticleEnrichmentService;
  let newsSourceRegistry: NewsSourceRegistry;

  beforeEach(async () => {
    const mockEnrichmentService = {
      enrichArticles: jest.fn(),
      getEnrichedArticle: jest.fn(),
      getEnrichmentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleCacheService,
          useValue: {
            getCached: jest.fn(),
            setCached: jest.fn(),
          },
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
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    cacheService = module.get<ArticleCacheService>(ArticleCacheService);
    newsSourceRegistry = module.get<NewsSourceRegistry>(NewsSourceRegistry);
    enrichmentService = module.get<ArticleEnrichmentService>(
      ArticleEnrichmentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllArticles', () => {
    it('should return cached articles when available', async () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: [mockEnrichedArticle],
      };

      jest.spyOn(cacheService, 'getCached').mockReturnValue(enrichedResponse);

      const result = await service.getAllArticles(NewsCategory.GENERAL);

      expect(result).toEqual(enrichedResponse);
      expect(cacheService.getCached).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
        undefined,
      );
      expect(newsSourceRegistry.getAvailableSources).not.toHaveBeenCalled();
      expect(enrichmentService.enrichArticles).not.toHaveBeenCalled();
    });

    it('should fetch from specific source when sourceId is provided', async () => {
      jest.spyOn(cacheService, 'getCached').mockReturnValue(null);
      const mockSource = {
        id: 'source1',
        name: 'Test Source',
        baseUrl: 'http://test.com',
        priority: 1,
        isEnabled: true,
        isAvailable: jest.fn().mockResolvedValue(true),
        getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
        fetchArticles: jest.fn().mockResolvedValue(mockArticleResponse),
      };
      jest.spyOn(newsSourceRegistry, 'getSource').mockReturnValue(mockSource);
      jest
        .spyOn(enrichmentService, 'enrichArticles')
        .mockResolvedValue([mockEnrichedArticle]);
      jest
        .spyOn(enrichmentService, 'getEnrichmentStatus')
        .mockResolvedValue(new Map([['0', 'completed']]));
      jest
        .spyOn(enrichmentService, 'getEnrichedArticle')
        .mockReturnValue(mockEnrichedArticle);

      const result = await service.getAllArticles(
        NewsCategory.GENERAL,
        'source1',
      );

      expect(result.articles).toEqual([mockEnrichedArticle]);
      expect(newsSourceRegistry.getSource).toHaveBeenCalledWith('source1');
      expect(mockSource.fetchArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
      expect(enrichmentService.enrichArticles).toHaveBeenCalledWith(
        mockArticleResponse.articles,
      );
    });

    it('should fetch and deduplicate articles from all sources when no sourceId provided', async () => {
      jest.spyOn(cacheService, 'getCached').mockReturnValue(null);
      const mockSources = [
        {
          id: 'source1',
          name: 'Test Source 1',
          baseUrl: 'http://test1.com',
          priority: 1,
          isEnabled: true,
          isAvailable: jest.fn().mockResolvedValue(true),
          getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
          fetchArticles: jest
            .fn()
            .mockResolvedValue({ ...mockArticleResponse }),
        },
        {
          id: 'source2',
          name: 'Test Source 2',
          baseUrl: 'http://test2.com',
          priority: 2,
          isEnabled: true,
          isAvailable: jest.fn().mockResolvedValue(true),
          getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
          fetchArticles: jest
            .fn()
            .mockResolvedValue({ ...mockArticleResponse }),
        },
      ];
      jest
        .spyOn(newsSourceRegistry, 'getAvailableSources')
        .mockResolvedValue(mockSources);
      jest
        .spyOn(enrichmentService, 'enrichArticles')
        .mockResolvedValue([mockEnrichedArticle]);
      jest
        .spyOn(enrichmentService, 'getEnrichmentStatus')
        .mockResolvedValue(new Map([['0', 'completed']]));
      jest
        .spyOn(enrichmentService, 'getEnrichedArticle')
        .mockReturnValue(mockEnrichedArticle);

      const result = await service.getAllArticles(NewsCategory.GENERAL);

      expect(result.articles).toEqual([mockEnrichedArticle]);
      expect(newsSourceRegistry.getAvailableSources).toHaveBeenCalled();
      expect(enrichmentService.enrichArticles).toHaveBeenCalled();
      expect(cacheService.setCached).toHaveBeenCalled();
    });

    it('should throw error when no news sources are available', async () => {
      jest.spyOn(cacheService, 'getCached').mockReturnValue(null);
      jest
        .spyOn(newsSourceRegistry, 'getAvailableSources')
        .mockResolvedValue([]);

      await expect(
        service.getAllArticles(NewsCategory.GENERAL),
      ).rejects.toThrow('No news sources available');
    });
  });

  describe('getArticleById', () => {
    it('should return article when valid id is provided', async () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: [mockEnrichedArticle],
      };

      jest.spyOn(cacheService, 'getCached').mockReturnValue(enrichedResponse);

      const result = await service.getArticleById(NewsCategory.GENERAL, '0');

      expect(result).toEqual(mockEnrichedArticle);
    });

    it('should throw ArticleNotFoundException for invalid index', async () => {
      const enrichedResponse = {
        ...mockArticleResponse,
        articles: [mockEnrichedArticle],
      };

      jest.spyOn(cacheService, 'getCached').mockReturnValue(enrichedResponse);

      await expect(
        service.getArticleById(NewsCategory.GENERAL, '-1'),
      ).rejects.toThrow(ArticleNotFoundException);
    });

    it('should throw ArticleNotFoundException when article not found', async () => {
      jest.spyOn(cacheService, 'getCached').mockReturnValue(null);
      const mockSources = [
        {
          id: 'source1',
          name: 'Test Source',
          baseUrl: 'http://test.com',
          priority: 1,
          isEnabled: true,
          isAvailable: jest.fn().mockResolvedValue(true),
          getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
          fetchArticles: jest.fn().mockResolvedValue({
            ...mockArticleResponse,
            articles: [],
          }),
        },
      ];
      jest
        .spyOn(newsSourceRegistry, 'getAvailableSources')
        .mockResolvedValue(mockSources);
      jest.spyOn(enrichmentService, 'enrichArticles').mockResolvedValue([]);

      await expect(
        service.getArticleById(NewsCategory.GENERAL, '0'),
      ).rejects.toThrow(ArticleNotFoundException);
    });
  });
});
