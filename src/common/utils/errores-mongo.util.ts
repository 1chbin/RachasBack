import { ConflictException } from '@nestjs/common';

export function lanzarSiDuplicado(error: unknown, mensaje: string): void {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    throw new ConflictException(mensaje);
  }
}
