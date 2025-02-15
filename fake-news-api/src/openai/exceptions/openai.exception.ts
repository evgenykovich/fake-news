import { HttpException, HttpStatus } from '@nestjs/common';

export class OpenAIException extends HttpException {
  constructor(message: string) {
    super(`OpenAI service error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
