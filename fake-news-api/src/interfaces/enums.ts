export enum RequestStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}
