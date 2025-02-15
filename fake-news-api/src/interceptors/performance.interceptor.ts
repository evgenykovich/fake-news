import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../monitoring/metrics.service';
import { RequestStatus } from '../interfaces/enums';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.metricsService.recordHttpRequestDuration(
          method,
          path,
          duration / 1000,
          RequestStatus.SUCCESS,
        );
      }),
    );
  }
}
