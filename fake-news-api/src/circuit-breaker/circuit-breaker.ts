import { CircuitBreakerState } from '../interfaces/enums';

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastError: Error | null = null;
  private nextAttempt: number = Date.now();

  constructor(
    private readonly options: {
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
      resetTimeout: number;
      onOpen?: () => void;
      onClose?: () => void;
      onHalfOpen?: () => void;
    },
  ) {}

  async fire<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() > this.nextAttempt) {
        this.halfOpen();
      } else {
        throw this.lastError || new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.close();
      }
    }
    this.failureCount = 0;
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastError = error;

    if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.options.failureThreshold
    ) {
      this.open();
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttempt = Date.now() + this.options.timeout;
    this.options.onOpen?.();
  }

  private halfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.successCount = 0;
    this.options.onHalfOpen?.();
  }

  private close(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastError = null;
    this.options.onClose?.();
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}
