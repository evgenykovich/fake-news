export const mockMetricsService = {
  recordRequestDuration: jest.fn(),
  incrementRequestCount: jest.fn(),
  incrementCacheHits: jest.fn(),
  incrementExternalApiRequests: jest.fn(),
  incrementCacheMisses: jest.fn(),
  incrementCacheEvictions: jest.fn(),
};
