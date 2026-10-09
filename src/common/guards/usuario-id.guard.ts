import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class UsuarioIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      usuarioId?: string;
    }>();

    const header = request.headers['x-usuario-id'];
    const valor = Array.isArray(header) ? header[0] : header;

    if (!valor || !isValidObjectId(valor)) {
      throw new ForbiddenException(
        'Se requiere el header x-usuario-id con un identificador válido',
      );
    }

    request.usuarioId = valor;
    return true;
  }
}
