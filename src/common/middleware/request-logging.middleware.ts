import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader;

    res.on('finish', () => {
      const entry = {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - started,
        appVersion: req.headers['x-app-version'],
        platform: req.headers['x-platform'],
      };
      this.logger.log(JSON.stringify(entry));
    });

    next();
  }
}
