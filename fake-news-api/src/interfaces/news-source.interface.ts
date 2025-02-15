import { NewsCategory } from './Categories';
import { ArticleResponse } from './Article';

export interface NewsSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  priority: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface NewsSource {
  id: string;
  name: string;
  baseUrl: string;
  priority: number;
  fetchArticles(category: NewsCategory): Promise<ArticleResponse>;
  isAvailable(): Promise<boolean>;
  getHealth(): Promise<NewsSourceHealth>;
}

export interface NewsSourceHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  failureCount: number;
  responseTime: number;
  rateLimitRemaining: number;
}
