import { HttpException, HttpStatus } from '@nestjs/common';

export class CircuitBreakerException extends HttpException {
  constructor(breakerId: string, message: string) {
    super(
      `Service ${breakerId} is currently unavailable: ${message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
