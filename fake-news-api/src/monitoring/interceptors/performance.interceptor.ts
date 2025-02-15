import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics.service';
import { RequestStatus } from '../../interfaces/enums';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, path } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          this.metricsService.recordHttpRequestDuration(
            method,
            path,
            duration,
            RequestStatus.SUCCESS,
          );
        },
        error: () => {
          const duration = (Date.now() - start) / 1000;
          this.metricsService.recordHttpRequestDuration(
            method,
            path,
            duration,
            RequestStatus.ERROR,
          );
        },
      }),
    );
  }
}
