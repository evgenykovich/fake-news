import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { configValidationSchema } from './configuration.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
      expandVariables: true,
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService, NestConfigModule],
})
export class ConfigModule {}
