import { ServiceUnavailableException } from '@nestjs/common';

export class ExternalAPIException extends ServiceUnavailableException {
  constructor(message: string) {
    super(`External API error: ${message}`);
  }
}
