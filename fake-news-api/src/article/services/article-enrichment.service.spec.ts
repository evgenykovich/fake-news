import { Test, TestingModule } from '@nestjs/testing';
import { ArticleEnrichmentService } from './article-enrichment.service';
import { OpenAIService } from '../../openai/openai.service';
import { ArticleQueueService } from '../../queue/article-queue.service';
import { mockArticle } from '../../test/test-utils';
import { EnrichmentException } from '../exceptions/enrichment.exception';
import { Article } from '../../interfaces/Article';
import { NewsCategory } from '../../interfaces/Categories';

describe('ArticleEnrichmentService', () => {
  let service: ArticleEnrichmentService;
  let openAIService: OpenAIService;
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleEnrichmentService,
        {
          provide: OpenAIService,
          useValue: {
            enrichArticle: jest.fn(),
          },
        },
        {
          provide: ArticleQueueService,
          useValue: {
            onArticleEnriched: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArticleEnrichmentService>(ArticleEnrichmentService);
    openAIService = module.get<OpenAIService>(OpenAIService);
    queueService = module.get<ArticleQueueService>(ArticleQueueService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize queue listener', () => {
      expect(queueService.onArticleEnriched).toHaveBeenCalled();
    });
  });

  describe('enrichArticle', () => {
    it('should return cached article if available', async () => {
      service['enrichedArticles'].set(mockArticle.id, mockEnrichedArticle);

      const result = await service.enrichArticle(mockArticle);

      expect(result).toEqual(mockEnrichedArticle);
      expect(openAIService.enrichArticle).not.toHaveBeenCalled();
    });

    it('should successfully enrich and cache a new article', async () => {
      jest
        .spyOn(openAIService, 'enrichArticle')
        .mockResolvedValueOnce(mockEnrichmentResult);

      const result = await service.enrichArticle(mockArticle);

      expect(result).toEqual(mockEnrichedArticle);
      expect(openAIService.enrichArticle).toHaveBeenCalledWith(mockArticle);
      expect(service['enrichedArticles'].get(mockArticle.id)).toEqual(
        mockEnrichedArticle,
      );
    });

    it('should handle enrichment failure correctly', async () => {
      const errorMessage = 'OpenAI Error';
      jest
        .spyOn(openAIService, 'enrichArticle')
        .mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.enrichArticle(mockArticle)).rejects.toThrow(
        EnrichmentException,
      );

      const failedArticle = service['enrichedArticles'].get(mockArticle.id);
      expect(failedArticle).toEqual({
        ...mockArticle,
        enrichmentStatus: 'failed',
      });
    });
  });

  describe('enrichArticles', () => {
    it('should enrich multiple articles', async () => {
      const articles = [mockArticle, { ...mockArticle, id: 'article2' }];

      jest
        .spyOn(openAIService, 'enrichArticle')
        .mockResolvedValue(mockEnrichmentResult);

      const results = await service.enrichArticles(articles);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result).toEqual({
          ...mockArticle,
          id: result.id,
          enrichmentStatus: 'completed',
          fake_title: mockEnrichmentResult.fake_title,
        });
      });
      expect(openAIService.enrichArticle).toHaveBeenCalledTimes(2);
    });

    it('should use cached articles when available', async () => {
      service['enrichedArticles'].set(mockArticle.id, mockEnrichedArticle);
      const articles = [mockArticle];

      const results = await service.enrichArticles(articles);

      expect(results[0]).toEqual(mockEnrichedArticle);
      expect(openAIService.enrichArticle).not.toHaveBeenCalled();
    });

    it('should handle enrichment failure for multiple articles', async () => {
      const articles = [mockArticle, { ...mockArticle, id: 'article2' }];
      jest
        .spyOn(openAIService, 'enrichArticle')
        .mockRejectedValueOnce(new Error('OpenAI Error'));

      await expect(service.enrichArticles(articles)).rejects.toThrow(
        EnrichmentException,
      );
    });
  });

  describe('getEnrichedArticle', () => {
    it('should return cached article if available', () => {
      service['enrichedArticles'].set(mockArticle.id, mockEnrichedArticle);

      const result = service.getEnrichedArticle(mockArticle.id);
      expect(result).toEqual(mockEnrichedArticle);
    });

    it('should return undefined for non-existent article', () => {
      const result = service.getEnrichedArticle('non-existent');
      expect(result).toBeUndefined();
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
