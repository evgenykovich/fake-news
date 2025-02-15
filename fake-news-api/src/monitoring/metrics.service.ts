import { Injectable, Logger } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { NewsCategory } from '../interfaces/Categories';
import { CircuitBreakerState } from '../interfaces/enums';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics = {
    cacheHits: new Map<string, number>(),
    cacheMisses: new Map<string, number>(),
    externalApiRequests: new Map<
      string,
      { success: number; failure: number }
    >(),
    sourceFallbacks: new Map<string, Map<string, number>>(),
    responseTime: new Map<string, number[]>(),
    errorCounts: new Map<string, number>(),
    queueSize: 0,
    queueProcessingTime: new Map<string, number[]>(),
  };

  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly requestsTotal: Counter<string>,
    @InjectMetric('cache_hits_total')
    private readonly cacheHits: Counter<string>,
    @InjectMetric('external_api_requests_total')
    private readonly externalApiRequests: Counter<string>,
    @InjectMetric('circuit_breaker_state')
    private readonly circuitBreakerState: Gauge<string>,
    @InjectMetric('queue_size')
    private readonly queueSize: Gauge<string>,
    @InjectMetric('queue_processing_time_seconds')
    private readonly queueProcessingTime: Histogram<string>,
    @InjectMetric('cache_evictions_total')
    private readonly cacheEvictions: Counter<string>,
  ) {}

  recordHttpRequestDuration(
    method: string,
    path: string,
    duration: number,
    status: 'success' | 'error',
  ) {
    try {
      this.requestDuration.observe({ method, path, status }, duration);
      this.logger.debug(
        `Recorded HTTP request duration: ${duration}s for ${method} ${path} (${status})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record request duration: ${error.message}`,
        error.stack,
      );
    }
  }

  incrementRequestCount(path: string, method: string, statusCode: number) {
    this.requestsTotal.inc({ path, method, status_code: statusCode });
  }

  incrementCacheHits(category: NewsCategory) {
    try {
      this.cacheHits.inc({ category: category.toString() });
    } catch (error) {
      this.logger.error(`Failed to increment cache hits: ${error.message}`);
    }
  }

  incrementCacheMisses(category: NewsCategory) {
    const current = this.metrics.cacheMisses.get(category) || 0;
    this.metrics.cacheMisses.set(category, current + 1);
  }

  incrementExternalApiRequests(api: string, success: boolean) {
    try {
      this.externalApiRequests.inc({ api, success: success.toString() });
    } catch (error) {
      this.logger.error(
        `Failed to increment external API requests: ${error.message}`,
      );
    }
  }

  incrementCircuitBreakerState(breakerId: string, state: CircuitBreakerState) {
    this.circuitBreakerState.set({ breaker_id: breakerId, state }, 1);
  }

  incrementSourceFallback(fromSource: string, toSource: string) {
    let sourceFallbacks = this.metrics.sourceFallbacks.get(fromSource);
    if (!sourceFallbacks) {
      sourceFallbacks = new Map<string, number>();
      this.metrics.sourceFallbacks.set(fromSource, sourceFallbacks);
    }
    const current = sourceFallbacks.get(toSource) || 0;
    sourceFallbacks.set(toSource, current + 1);
    this.requestsTotal.inc({
      type: 'fallback',
      from_source: fromSource,
      to_source: toSource,
    });

    this.logger.log(
      `Source fallback: ${fromSource} -> ${toSource} (total: ${current + 1})`,
    );
  }

  recordResponseTime(endpoint: string, timeMs: number) {
    const times = this.metrics.responseTime.get(endpoint) || [];
    times.push(timeMs);

    if (times.length > 1000) {
      times.shift();
    }
    this.metrics.responseTime.set(endpoint, times);
  }

  incrementErrorCount(errorType: string) {
    const current = this.metrics.errorCounts.get(errorType) || 0;
    this.metrics.errorCounts.set(errorType, current + 1);
  }
  incrementCacheEvictions(category: NewsCategory) {
    try {
      this.cacheEvictions.inc({ category: category.toString() });
      this.logger.debug(`Cache eviction recorded for category: ${category}`);
    } catch (error) {
      this.logger.error(
        `Failed to increment cache evictions: ${error.message}`,
      );
    }
  }

  recordQueueSize(size: number) {
    try {
      this.queueSize.set(size);
    } catch (error) {
      this.logger.error(`Failed to record queue size: ${error.message}`);
    }
  }

  recordQueueProcessingTime(duration: number) {
    try {
      this.queueProcessingTime.observe(duration);
    } catch (error) {
      this.logger.error(
        `Failed to record queue processing time: ${error.message}`,
      );
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      queueMetrics: {
        size: this.metrics.queueSize,
        processingTimes: Array.from(this.metrics.queueProcessingTime.values()),
      },
    };
  }

  resetMetrics() {
    this.metrics = {
      cacheHits: new Map(),
      cacheMisses: new Map(),
      externalApiRequests: new Map(),
      sourceFallbacks: new Map(),
      responseTime: new Map(),
      errorCounts: new Map(),
      queueSize: 0,
      queueProcessingTime: new Map(),
    };
  }

  setCircuitBreakerState(service: string, isOpen: boolean) {
    try {
      this.circuitBreakerState.set({ service }, isOpen ? 1 : 0);
    } catch (error) {
      this.logger.error(
        `Failed to set circuit breaker state: ${error.message}`,
      );
    }
  }
}
