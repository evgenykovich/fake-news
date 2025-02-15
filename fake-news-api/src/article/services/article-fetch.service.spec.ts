import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ArticleFetchService } from './article-fetch.service';
import { NewsCategory } from '../../interfaces/Categories';
import { mockArticleResponse, mockConfig } from '../../test/test-utils';
import { ExternalAPIException } from '../exceptions/external-api.exception';
import { MetricsService } from '../../monitoring/metrics.service';
import { mockMetricsService } from '../../test/mocks/metrics.service.mock';
import { CircuitBreakerService } from '../../circuit-breaker/circuit-breaker.service';

describe('ArticleFetchService', () => {
  let service: ArticleFetchService;
  let mockCircuitBreaker: jest.Mocked<CircuitBreakerService>;

  beforeEach(async () => {
    mockCircuitBreaker = {
      logger: new Logger(),
      breakers: new Map(),
      metricsService: mockMetricsService,
      executeWithBreaker: jest
        .fn()
        .mockImplementation((key: string, fn: () => Promise<any>) => fn()),
      getState: jest.fn().mockReturnValue('CLOSED'),
    } as unknown as jest.Mocked<CircuitBreakerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleFetchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'NEWS_API_URL':
                  return mockConfig.newsApi.url;
                case 'NEWS_API_KEY':
                  return mockConfig.newsApi.key;
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreaker,
        },
      ],
    }).compile();

    service = module.get<ArticleFetchService>(ArticleFetchService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchArticles', () => {
    it('should successfully fetch articles', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockArticleResponse),
      });

      const result = await service.fetchArticles(NewsCategory.GENERAL);

      expect(result).toEqual(mockArticleResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(mockConfig.newsApi.url),
      );
      expect(
        mockMetricsService.incrementExternalApiRequests,
      ).toHaveBeenCalledWith('newsapi', true);
    });

    it('should throw ExternalAPIException on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error' }),
      });

      await expect(service.fetchArticles(NewsCategory.GENERAL)).rejects.toThrow(
        ExternalAPIException,
      );

      expect(
        mockMetricsService.incrementExternalApiRequests,
      ).toHaveBeenCalledWith('newsapi', false);
    });

    it('should throw ExternalAPIException on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network Error'),
      );

      await expect(service.fetchArticles(NewsCategory.GENERAL)).rejects.toThrow(
        ExternalAPIException,
      );

      expect(
        mockMetricsService.incrementExternalApiRequests,
      ).toHaveBeenCalledWith('newsapi', false);
    });
  });
});
