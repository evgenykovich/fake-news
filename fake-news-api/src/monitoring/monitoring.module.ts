import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';

@Module({
  imports: [PrometheusModule.register()],
  providers: [
    MetricsService,
    PerformanceInterceptor,
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
    }),
    makeCounterProvider({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['category'],
    }),
    makeCounterProvider({
      name: 'external_api_requests_total',
      help: 'Total number of external API requests',
      labelNames: ['api', 'success'],
    }),
    makeGaugeProvider({
      name: 'circuit_breaker_state',
      help: 'Current state of circuit breakers',
      labelNames: ['service'],
    }),
    makeGaugeProvider({
      name: 'queue_size',
      help: 'Current size of the article enrichment queue',
    }),
    makeHistogramProvider({
      name: 'queue_processing_time_seconds',
      help: 'Time taken to process queue items in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'cache_evictions_total',
      help: 'Total number of cache evictions',
      labelNames: ['category'],
    }),
  ],
  exports: [MetricsService, PerformanceInterceptor],
})
export class MonitoringModule {}
