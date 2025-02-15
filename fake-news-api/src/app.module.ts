import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArticleModule } from './article/article.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OpenAIModule } from './openai/openai.module';
import { QueueModule } from './queue/queue.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { NewsSourceModule } from './news-sources/news-source.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceInterceptor } from './monitoring/interceptors/performance.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MonitoringModule,
    ArticleModule,
    OpenAIModule,
    QueueModule,
    CircuitBreakerModule,
    NewsSourceModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
