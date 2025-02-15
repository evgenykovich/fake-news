import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { Article, ArticleResponse } from '../interfaces/Article';
import { NewsCategory } from '../interfaces/Categories';
import { API_RESPONSES, API_QUERIES } from '../interfaces/api-responses';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetArticleQueryDto } from './dto/get-article-query.dto';
import { ArticleDto, ArticleResponseDto } from './dto/article.dto';
import { ArticleEnrichmentService } from './services/article-enrichment.service';

@ApiTags('Articles')
@ApiBearerAuth()
@ApiExtraModels(ArticleDto, ArticleResponseDto)
@Controller('articles')
@UseGuards(ThrottlerGuard)
export class ArticleController {
  private readonly categories = Object.values(NewsCategory);

  constructor(
    private readonly articleService: ArticleService,
    private readonly enrichmentService: ArticleEnrichmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all articles with satirical headlines' })
  @ApiQuery(API_QUERIES.CATEGORY)
  @ApiResponse(API_RESPONSES.ARTICLES.GET_ALL)
  async getArticles(
    @Query('category') category: NewsCategory = NewsCategory.GENERAL,
  ): Promise<ArticleResponse> {
    return await this.articleService.getAllArticles(category);
  }
  @Get('categories')
  @ApiOperation({ summary: 'Get all available news categories' })
  @ApiResponse(API_RESPONSES.CATEGORIES.GET_ALL)
  getCategories(): string[] {
    const categories = this.categories.map((category) =>
      category.toLowerCase(),
    );
    return categories;
  }
  @Get(':category')
  @ApiOperation({
    summary: 'Get all articles by category',
    description:
      'Retrieves a list of articles for a specific news category, including their satirical versions',
  })
  @ApiParam({
    name: 'category',
    enum: NewsCategory,
    description: 'News category to filter articles',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  @ApiResponse({
    status: 503,
    description: 'Service temporarily unavailable',
  })
  async getAllArticles(
    @Param('category') category: NewsCategory,
    @Query() query: GetArticleQueryDto,
  ): Promise<Article[]> {
    const response = await this.articleService.getAllArticles(category);
    const articles = response.articles;

    if (query.waitForEnrichment) {
      const MAX_WAIT_TIME = 10000;
      const POLL_INTERVAL = 500;
      const startTime = Date.now();

      while (Date.now() - startTime < MAX_WAIT_TIME) {
        const statuses = await this.enrichmentService.getEnrichmentStatus(
          articles.map((a) => a.id),
        );

        const allCompleted = Array.from(statuses.values()).every(
          (status) => status === 'completed' || status === 'failed',
        );

        if (allCompleted) {
          return articles.map((article) => {
            const enriched = this.enrichmentService.getEnrichedArticle(
              article.id,
            );
            return (
              enriched || {
                ...article,
                title: article.title || 'No title available',
                fake_title: article.fake_title || article.title,
                description: article.description || 'No description available',
                url: article.url || '#',
                imageUrl: article.urlToImage || '',
                source: article.source || { id: '', name: 'Unknown' },
                publishedAt: article.publishedAt || new Date().toISOString(),
                enrichmentStatus: 'failed',
              }
            );
          });
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    return articles.map((article) => {
      const enriched = this.enrichmentService.getEnrichedArticle(article.id);
      return (
        enriched || {
          ...article,
          title: article.title || 'No title available',
          fake_title: article.fake_title || article.title,
          description: article.description || 'No description available',
          url: article.url || '#',
          imageUrl: article.urlToImage || '',
          source: article.source || { id: '', name: 'Unknown' },
          publishedAt: article.publishedAt || new Date().toISOString(),
          enrichmentStatus: 'pending',
        }
      );
    });
  }
  @Get(':category/:id')
  @ApiOperation({
    summary: 'Get article by ID',
    description:
      'Retrieves a specific article by its ID and category, including its satirical version',
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
    type: ArticleDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async getArticle(
    @Param('category') category: NewsCategory,
    @Param('id') id: string,
    @Query() query: GetArticleQueryDto,
  ): Promise<Article> {
    const article = await this.articleService.getArticleById(category, id);

    if (query.waitForEnrichment) {
      const MAX_WAIT_TIME = 10000;
      const POLL_INTERVAL = 500;
      const startTime = Date.now();

      while (Date.now() - startTime < MAX_WAIT_TIME) {
        const enriched = this.enrichmentService.getEnrichedArticle(article.id);
        if (enriched?.enrichmentStatus === 'completed') {
          return enriched;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    }

    const enriched = this.enrichmentService.getEnrichedArticle(article.id);
    return (
      enriched || {
        ...article,
        title: article.title || 'No title available',
        fake_title: article.fake_title || article.title,
        description: article.description || 'No description available',
        url: article.url || '#',
        urlToImage: article.urlToImage || '',
        source: article.source || { id: '', name: 'Unknown' },
        publishedAt: article.publishedAt || new Date().toISOString(),
        enrichmentStatus: 'pending',
      }
    );
  }
}
