import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '../config/config.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [ConfigModule, MonitoringModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
