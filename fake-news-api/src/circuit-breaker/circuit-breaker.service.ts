import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../monitoring/metrics.service';
import { CircuitBreakerException } from './exceptions/circuit-breaker.exception';
import { CircuitBreaker } from './circuit-breaker';
import { CircuitBreakerState } from '../interfaces/enums';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers: Map<string, CircuitBreaker> = new Map();

  constructor(private readonly metricsService: MetricsService) {}

  async executeWithBreaker<T>(
    breakerId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let breaker = this.breakers.get(breakerId);

    if (!breaker) {
      breaker = new CircuitBreaker({
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 10000,
        resetTimeout: 30000,
        onOpen: () => {
          this.logger.warn(`Circuit breaker ${breakerId} opened`);
          this.metricsService.incrementCircuitBreakerState(
            breakerId,
            CircuitBreakerState.OPEN,
          );
        },
        onClose: () => {
          this.logger.log(`Circuit breaker ${breakerId} closed`);
          this.metricsService.incrementCircuitBreakerState(
            breakerId,
            CircuitBreakerState.CLOSED,
          );
        },
        onHalfOpen: () => {
          this.logger.log(`Circuit breaker ${breakerId} half-open`);
          this.metricsService.incrementCircuitBreakerState(
            breakerId,
            CircuitBreakerState.HALF_OPEN,
          );
        },
      });
      this.breakers.set(breakerId, breaker);
    }

    try {
      return await breaker.fire(operation);
    } catch (error) {
      this.logger.error(
        `Circuit breaker ${breakerId} operation failed: ${error.message}`,
      );
      throw new CircuitBreakerException(breakerId, error.message);
    }
  }

  getState(breakerId: string): CircuitBreakerState | null {
    return this.breakers.get(breakerId)?.getState() ?? null;
  }
}
