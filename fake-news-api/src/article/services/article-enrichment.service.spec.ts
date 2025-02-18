import { Test, TestingModule } from '@nestjs/testing';
import { ArticleEnrichmentService } from './article-enrichment.service';
import { ArticleQueueService } from '../../queue/article-queue.service';
import { mockArticle } from '../../test/test-utils';
import { EnrichmentException } from '../exceptions/enrichment.exception';
import { Article } from '../../interfaces/Article';
import { NewsCategory } from '../../interfaces/Categories';

describe('ArticleEnrichmentService', () => {
  let service: ArticleEnrichmentService;
  let queueService: ArticleQueueService;

  const mockEnrichmentResult = {
    fake_title: 'Enriched Title',
    derived_category: 'TECHNOLOGY' as NewsCategory,
  };

  const mockEnrichedArticle: Article = {
    ...mockArticle,
    enrichmentStatus: 'completed',
    fake_title: mockEnrichmentResult.fake_title,
  };

  beforeEach(async () => {
    const mockQueueService = {
      addToQueue: jest.fn(),
      onArticleEnriched: jest.fn((callback) => {
        mockQueueService.enrichedCallback = callback;
      }),
      onArticleEnrichmentFailed: jest.fn((callback) => {
        mockQueueService.failedCallback = callback;
      }),
      enrichedCallback: null as ((article: Article) => void) | null,
      failedCallback: null as ((article: Article) => void) | null,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleEnrichmentService,
        {
          provide: ArticleQueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<ArticleEnrichmentService>(ArticleEnrichmentService);
    queueService = module.get<ArticleQueueService>(ArticleQueueService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize queue listeners', () => {
      expect(queueService.onArticleEnriched).toHaveBeenCalled();
      expect(queueService.onArticleEnrichmentFailed).toHaveBeenCalled();
    });
  });

  describe('enrichArticle', () => {
    it('should return cached article if available', async () => {
      service['enrichedArticles'].set(mockArticle.id, mockEnrichedArticle);

      const result = await service.enrichArticle(mockArticle);

      expect(result).toEqual(mockEnrichedArticle);
      expect(queueService.addToQueue).not.toHaveBeenCalled();
    });

    it('should add article to queue and return pending status', async () => {
      const result = await service.enrichArticle(mockArticle);

      expect(result).toEqual({
        ...mockArticle,
        enrichmentStatus: 'pending',
      });
      expect(queueService.addToQueue).toHaveBeenCalledWith([mockArticle]);
    });

    it('should handle enrichment callbacks', async () => {
      const mockQueueService = queueService as any;
      mockQueueService.enrichedCallback(mockEnrichedArticle);

      const cachedArticle = service.getEnrichedArticle(mockArticle.id);
      expect(cachedArticle).toEqual(mockEnrichedArticle);

      const failedArticle = {
        ...mockArticle,
        enrichmentStatus: 'failed' as const,
      };
      mockQueueService.failedCallback(failedArticle);

      const cachedFailedArticle = service.getEnrichedArticle(failedArticle.id);
      expect(cachedFailedArticle).toEqual(failedArticle);
    });
  });

  describe('enrichArticles', () => {
    it('should enrich multiple articles', async () => {
      const articles = [mockArticle, { ...mockArticle, id: 'article2' }];

      jest.clearAllMocks();

      const results = await service.enrichArticles(articles);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.enrichmentStatus).toBe('pending');
      });

      expect(queueService.addToQueue).toHaveBeenCalledTimes(1);
      expect(queueService.addToQueue).toHaveBeenCalledWith(articles);
    });

    it('should handle empty article array', async () => {
      const results = await service.enrichArticles([]);

      expect(results).toHaveLength(0);
      expect(queueService.addToQueue).not.toHaveBeenCalled();
    });

    it('should handle enrichment errors', async () => {
      const articles = [mockArticle];
      jest
        .spyOn(queueService, 'addToQueue')
        .mockRejectedValue(new Error('Queue error'));

      await expect(service.enrichArticles(articles)).rejects.toThrow(
        EnrichmentException,
      );
    });
  });

  describe('getEnrichmentStatus', () => {
    it('should return correct status for multiple articles', async () => {
      service['enrichedArticles'].set(mockArticle.id, mockEnrichedArticle);
      const articleIds = [mockArticle.id, 'non-existent'];

      const statusMap = await service.getEnrichmentStatus(articleIds);

      expect(statusMap.get(mockArticle.id)).toBe('completed');
      expect(statusMap.get('non-existent')).toBe('pending');
    });
  });
});
