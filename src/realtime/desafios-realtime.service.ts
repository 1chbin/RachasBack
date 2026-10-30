import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { GamificacionService } from '../gamificacion/gamificacion.service';
import type { FilaRanking } from '../gamificacion/fila-ranking.interface';
import { REALTIME_EVENT, salaDesafio } from './realtime.constants';

@Injectable()
export class DesafiosRealtimeService {
  private server: Server | null = null;

  constructor(
    @Inject(forwardRef(() => GamificacionService))
    private readonly gamificacionService: GamificacionService,
  ) {}

  registrarServer(server: Server): void {
    this.server = server;
  }

  private emitir(desafioId: string, evento: string, payload: unknown): void {
    if (!this.server) {
      return;
    }
    this.server.to(salaDesafio(desafioId)).emit(evento, payload);
  }

  private async emitirRanking(desafioId: string): Promise<FilaRanking[]> {
    const ranking =
      await this.gamificacionService.obtenerFilasRanking(desafioId);
    this.emitir(desafioId, REALTIME_EVENT.RANKING_ACTUALIZADO, {
      desafioId,
      ranking,
    });
    return ranking;
  }

  async emitirCheckInRegistrado(
    desafioId: string,
    payload: {
      checkIn: Record<string, unknown>;
      usuarioId: string;
      alias: string;
    },
  ): Promise<void> {
    this.emitir(desafioId, REALTIME_EVENT.CHECKIN_REGISTRADO, {
      desafioId,
      ...payload,
    });
    await this.emitirRanking(desafioId);
  }

  async emitirCheckInDeshecho(
    desafioId: string,
    payload: { usuarioId: string; dia: string },
  ): Promise<void> {
    this.emitir(desafioId, REALTIME_EVENT.CHECKIN_DESHECHO, {
      desafioId,
      ...payload,
    });
    await this.emitirRanking(desafioId);
  }

  async emitirParticipanteUnido(
    desafioId: string,
    payload: { usuarioId: string; alias: string },
  ): Promise<void> {
    this.emitir(desafioId, REALTIME_EVENT.PARTICIPANTE_UNIDO, {
      desafioId,
      ...payload,
    });
    await this.emitirRanking(desafioId);
  }

  async emitirParticipanteAbandono(
    desafioId: string,
    payload: { usuarioId: string; alias: string },
  ): Promise<void> {
    this.emitir(desafioId, REALTIME_EVENT.PARTICIPANTE_ABANDONO, {
      desafioId,
      ...payload,
    });
    await this.emitirRanking(desafioId);
  }

  emitirDesafioCancelado(desafioId: string): void {
    this.emitir(desafioId, REALTIME_EVENT.DESAFIO_CANCELADO, {
      desafioId,
      estado: 'CANCELADO',
    });
  }
}
