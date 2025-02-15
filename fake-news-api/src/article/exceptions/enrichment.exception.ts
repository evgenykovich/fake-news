import { InternalServerErrorException } from '@nestjs/common';

export class EnrichmentException extends InternalServerErrorException {
  constructor(message: string) {
    super(`Article enrichment failed: ${message}`);
  }
}
