import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { ArticleEnrichmentService } from './services/article-enrichment.service';
import { NewsCategory } from '../interfaces/Categories';
import {
  mockArticle,
  mockArticleResponse,
  mockEnrichedArticle,
} from '../test/test-utils';
import { GetArticleQueryDto } from './dto/get-article-query.dto';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('ArticleController', () => {
  let controller: ArticleController;
  let articleService: ArticleService;
  let enrichmentService: ArticleEnrichmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: {
            getAllArticles: jest.fn().mockResolvedValue(mockArticleResponse),
            getArticleById: jest.fn().mockResolvedValue(mockArticle),
          },
        },
        {
          provide: ArticleEnrichmentService,
          useValue: {
            getEnrichedArticle: jest.fn().mockReturnValue(mockEnrichedArticle),
            getEnrichmentStatus: jest
              .fn()
              .mockResolvedValue(new Map([[mockArticle.id, 'completed']])),
          },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
    articleService = module.get<ArticleService>(ArticleService);
    enrichmentService = module.get<ArticleEnrichmentService>(
      ArticleEnrichmentService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getArticles', () => {
    it('should return articles for default category', async () => {
      const result = await controller.getArticles();
      expect(result).toEqual(mockArticleResponse);
      expect(articleService.getAllArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
    });

    it('should return articles for specified category', async () => {
      const result = await controller.getArticles(NewsCategory.BUSINESS);
      expect(result).toEqual(mockArticleResponse);
      expect(articleService.getAllArticles).toHaveBeenCalledWith(
        NewsCategory.BUSINESS,
      );
    });
  });

  describe('getCategories', () => {
    it('should return all categories in lowercase', () => {
      const result = controller.getCategories();
      expect(result).toEqual(
        Object.values(NewsCategory).map((cat) => cat.toLowerCase()),
      );
    });
  });

  describe('getAllArticles', () => {
    it('should return enriched articles without waiting', async () => {
      const query: GetArticleQueryDto = { waitForEnrichment: false };
      const result = await controller.getAllArticles(
        NewsCategory.GENERAL,
        query,
      );

      expect(result).toEqual([mockEnrichedArticle]);
      expect(articleService.getAllArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
      expect(enrichmentService.getEnrichedArticle).toHaveBeenCalled();
    });

    it('should wait for enrichment when specified', async () => {
      const query: GetArticleQueryDto = { waitForEnrichment: true };
      const result = await controller.getAllArticles(
        NewsCategory.GENERAL,
        query,
      );

      expect(result).toEqual([mockEnrichedArticle]);
      expect(articleService.getAllArticles).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
      );
      expect(enrichmentService.getEnrichmentStatus).toHaveBeenCalled();
      expect(enrichmentService.getEnrichedArticle).toHaveBeenCalled();
    });
  });

  describe('getArticle', () => {
    it('should return enriched article without waiting', async () => {
      const query: GetArticleQueryDto = { waitForEnrichment: false };
      const result = await controller.getArticle(
        NewsCategory.GENERAL,
        '1',
        query,
      );

      expect(result).toEqual(mockEnrichedArticle);
      expect(articleService.getArticleById).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
        '1',
      );
      expect(enrichmentService.getEnrichedArticle).toHaveBeenCalled();
    });

    it('should wait for enrichment when specified', async () => {
      const query: GetArticleQueryDto = { waitForEnrichment: true };
      const result = await controller.getArticle(
        NewsCategory.GENERAL,
        '1',
        query,
      );

      expect(result).toEqual(mockEnrichedArticle);
      expect(articleService.getArticleById).toHaveBeenCalledWith(
        NewsCategory.GENERAL,
        '1',
      );
      expect(enrichmentService.getEnrichedArticle).toHaveBeenCalled();
    });
  });
});
