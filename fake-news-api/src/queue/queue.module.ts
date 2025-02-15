import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ArticleQueueService } from './article-queue.service';
import { OpenAIModule } from '../openai/openai.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    OpenAIModule,
    MonitoringModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  providers: [ArticleQueueService],
  exports: [ArticleQueueService],
})
export class QueueModule {}
