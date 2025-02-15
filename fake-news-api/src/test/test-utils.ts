import { NewsCategory } from '../interfaces/Categories';
import { Article, ArticleResponse } from '../interfaces/Article';

export const mockArticle: Article = {
  id: 'test-article-1',
  source: { id: 'test-source', name: 'Test Source' },
  author: 'Test Author',
  title: 'Original Test Title',
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

export const mockEnrichedArticle: Article = {
  ...mockArticle,
  fake_title: 'Satirical Test Title',
  enrichmentStatus: 'completed',
};

export const mockConfig = {
  newsApi: {
    url: 'https://test-news-api.com',
    key: 'test-news-api-key',
  },
  openAi: {
    url: 'https://test-openai-api.com',
    key: 'test-openai-key',
  },
  cache: {
    ttl: 300000,
  },
};
