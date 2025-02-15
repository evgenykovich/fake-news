import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get newsApi() {
    return {
      url: this.configService.get<string>('NEWS_API_URL'),
      key: this.configService.get<string>('NEWS_API_KEY'),
    };
  }

  get openAi() {
    return {
      url: this.configService.get<string>('OPENAI_API_URL'),
      key: this.configService.get<string>('OPENAI_API_KEY'),
    };
  }

  get cache() {
    return {
      ttl: this.configService.get<number>('CACHE_TTL'),
    };
  }

  get cors() {
    return {
      origins: this.configService.get<string>('ALLOWED_ORIGINS').split(','),
    };
  }

  get rateLimit() {
    return {
      windowMs: this.configService.get<number>('RATE_LIMIT_WINDOW'),
      max: this.configService.get<number>('RATE_LIMIT_MAX'),
    };
  }
}
