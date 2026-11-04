import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { esVersionMenorQue } from './semver.util';

@Injectable()
export class AppVersionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      url?: string;
    }>();

    const url = request.url ?? '';
    if (url.includes('/health') || url.includes('/version-policy')) {
      return true;
    }

    const minVersion =
      this.configService.get<string>('MIN_APP_VERSION')?.trim() ?? '1.0.0';
    const rawVersion = request.headers['x-app-version'];
    const appVersion = Array.isArray(rawVersion)
      ? rawVersion[0]
      : rawVersion?.trim();

    if (!appVersion) {
      return true;
    }

    if (esVersionMenorQue(appVersion, minVersion)) {
      throw new HttpException(
        {
          statusCode: 426,
          message: 'Actualizá la app para continuar',
          minVersion,
        },
        426,
      );
    }

    return true;
  }
}
