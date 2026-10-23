import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { FirebaseAuthService } from './firebase-auth.service';
import { AuthUsuarioService } from './auth-usuario.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly authUsuarioService: AuthUsuarioService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      usuarioId?: string;
      firebaseUid?: string;
    }>();

    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere un token de autenticación');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Se requiere un token de autenticación');
    }

    try {
      const decoded = await this.firebaseAuthService.verifyIdToken(token);
      const usuario = await this.authUsuarioService.findOrCreateFromToken(
        decoded,
      );
      request.usuarioId = usuario.id;
      request.firebaseUid = decoded.uid;
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }
}
