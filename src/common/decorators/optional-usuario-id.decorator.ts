import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

export const OptionalUsuarioId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const header = request.headers['x-usuario-id'];
    const valor = Array.isArray(header) ? header[0] : header;

    if (!valor) {
      return undefined;
    }

    if (!isValidObjectId(valor)) {
      throw new ForbiddenException(
        'El header x-usuario-id no es un identificador válido',
      );
    }

    return valor;
  },
);
