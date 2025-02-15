import { HttpException, HttpStatus } from '@nestjs/common';

export class SourceNotFoundException extends HttpException {
  constructor(sourceId: string) {
    super(`News source with ID '${sourceId}' not found`, HttpStatus.NOT_FOUND);
  }
}
