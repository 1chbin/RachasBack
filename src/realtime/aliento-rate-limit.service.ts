import { Injectable } from '@nestjs/common';
import { ALIENTO_RATE_LIMIT_MS } from './aliento.constants';

@Injectable()
export class AlientoRateLimitService {
  private readonly ultimoEnvio = new Map<string, number>();

  private clave(usuarioId: string, desafioId: string): string {
    return `${usuarioId}:${desafioId}`;
  }

  /** true si puede enviar ahora; si false, registra el intento bloqueado sin actualizar ventana. */
  intentar(usuarioId: string, desafioId: string): boolean {
    const key = this.clave(usuarioId, desafioId);
    const ahora = Date.now();
    const previo = this.ultimoEnvio.get(key);
    if (previo !== undefined && ahora - previo < ALIENTO_RATE_LIMIT_MS) {
      return false;
    }
    this.ultimoEnvio.set(key, ahora);
    return true;
  }
}
