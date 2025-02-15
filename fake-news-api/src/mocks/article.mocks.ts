import { Article, ArticleResponse } from '../interfaces/Article';
import { NewsCategory } from '../interfaces/Categories';

export const mockArticle: Article = {
  id: 'mock-article-1',
  source: { id: 'test-source', name: 'Test Source' },
  author: 'Test Author',
  title: 'Test Title',
  description: 'Test Description',
  url: 'https://test.com',
  urlToImage: 'https://test.com/image.jpg',
  publishedAt: '2024-03-14T12:00:00Z',
  content: 'Test Content',
};

export const mockArticleResponse: ArticleResponse = {
  status: 'ok',
  totalResults: 1,
  articles: [mockArticle],
};

export const mockArticleService = {
  getAllArticles: jest.fn().mockResolvedValue(mockArticleResponse),
  getArticleById: jest.fn().mockResolvedValue(mockArticle),
};

export const mockOpenAIService = {
  generateTrollTitle: jest.fn().mockResolvedValue('Mocked Troll Title'),
  deriveCategory: jest.fn().mockResolvedValue(NewsCategory.GENERAL),
  enrichArticle: jest.fn().mockResolvedValue({
    fake_title: 'Mocked Troll Title',
    derivedCategory: NewsCategory.GENERAL,
  }),
};

export const mockEnrichedArticle: Article = {
  ...mockArticle,
  enrichmentStatus: 'completed',
  fake_title: 'Mocked Troll Title',
};

export const mockEnrichedResponse: ArticleResponse = {
  ...mockArticleResponse,
  articles: [mockEnrichedArticle],
};
