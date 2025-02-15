import helmet from 'helmet';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityService {
  constructor(private readonly configService: ConfigService) {}

  getCorsConfig() {
    const allowedOrigins = this.configService
      .get<string>('ALLOWED_ORIGINS')
      ?.split(',') || ['http://localhost:3000'];

    return {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600,
    };
  }

  getHelmetConfig() {
    return helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      crossOriginOpenerPolicy: {
        policy: 'same-origin',
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
    });
  }
}
