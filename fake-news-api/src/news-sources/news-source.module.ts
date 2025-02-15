import { Module } from '@nestjs/common';
import { NewsSourceRegistry } from './news-source.registry';
import { NewsAPISource } from './implementations/newsapi.source';
import { ConfigModule } from '../config/config.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';

@Module({
  imports: [ConfigModule, MonitoringModule, CircuitBreakerModule],
  providers: [NewsSourceRegistry, NewsAPISource],
  exports: [NewsSourceRegistry],
})
export class NewsSourceModule {}
