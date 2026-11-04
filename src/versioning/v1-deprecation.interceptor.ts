import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, tap } from 'rxjs';

@Injectable()
export class V1DeprecationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ApiV1');

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ version?: string }>();
    if (request.version !== '1') {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();
    const sunset =
      this.configService.get<string>('V1_SUNSET_DATE')?.trim() ??
      '2026-12-31';
    response.setHeader('Deprecation', 'true');
    response.setHeader('Sunset', sunset);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            event: 'api_v1_request',
            path: (request as { url?: string }).url,
          }),
        );
      }),
    );
  }
}
