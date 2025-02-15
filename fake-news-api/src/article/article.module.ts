import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { ArticleCacheService } from './services/article-cache.service';
import { ArticleEnrichmentService } from './services/article-enrichment.service';
import { ArticleQueueService } from '../queue/article-queue.service';
import { OpenAIModule } from '../openai/openai.module';
import { ConfigModule } from '../config/config.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NewsSourceModule } from '../news-sources/news-source.module';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    ConfigModule,
    OpenAIModule,
    MonitoringModule,
    NewsSourceModule,
    CircuitBreakerModule,
    SecurityModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
      {
        ttl: 3600000,
        limit: 1000,
      },
    ]),
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleCacheService,
    ArticleEnrichmentService,
    ArticleQueueService,
  ],
})
export class ArticleModule {}
