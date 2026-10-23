import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OptionalUsuarioId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ usuarioId?: string }>();
    return request.usuarioId;
  },
);
