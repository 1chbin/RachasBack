import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UsuarioId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ usuarioId?: string }>();
    return request.usuarioId as string;
  },
);
