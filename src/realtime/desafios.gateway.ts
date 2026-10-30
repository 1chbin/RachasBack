import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { HttpException, Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FirebaseAuthService } from '../auth/firebase-auth.service';
import { AuthUsuarioService } from '../auth/auth-usuario.service';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { DesafiosRealtimeService } from './desafios-realtime.service';
import {
  emojiDeAliento,
  esAlientoEmojiValido,
} from './aliento.constants';
import { AlientoRateLimitService } from './aliento-rate-limit.service';
import { REALTIME_EVENT, salaDesafio } from './realtime.constants';

type SocketData = {
  usuarioId?: string;
  alias?: string;
};

type SuscribirPayload = { desafioId?: string };

type SuscribirAck = { ok: true } | { ok: false; message: string };

type EnviarAlientoPayload = {
  desafioId?: string;
  destinatarioUsuarioId?: string;
  emojiId?: string;
};

function extraerToken(client: Socket): string | null {
  const authToken = client.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  const authorization = client.handshake.headers.authorization;
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    return token || null;
  }

  return null;
}

@WebSocketGateway({
  cors: { origin: true },
})
export class DesafiosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DesafiosGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly authUsuarioService: AuthUsuarioService,
    private readonly participacionesService: ParticipacionesService,
    private readonly desafiosRealtimeService: DesafiosRealtimeService,
    private readonly alientoRateLimitService: AlientoRateLimitService,
  ) {}

  afterInit(server: Server): void {
    this.desafiosRealtimeService.registrarServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = extraerToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const decoded = await this.firebaseAuthService.verifyIdToken(token);
      const usuario = await this.authUsuarioService.findOrCreateFromToken(
        decoded,
      );
      const data = client.data as SocketData;
      data.usuarioId = usuario.id;
      data.alias = String(usuario.alias);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() !== 401) {
        this.logger.warn(
          `Conexión WS rechazada: ${error.message}`,
        );
      } else if (!(error instanceof UnauthorizedException)) {
        this.logger.warn('Conexión WS rechazada: token inválido');
      }
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket): void {
    // Socket.IO elimina al cliente de las salas al desconectar.
  }

  @SubscribeMessage(REALTIME_EVENT.DESAFIO_SUSCRIBIR)
  async suscribirDesafio(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SuscribirPayload,
  ): Promise<SuscribirAck> {
    const data = client.data as SocketData;
    const usuarioId = data.usuarioId;
    if (!usuarioId) {
      return { ok: false, message: 'Conexión no autenticada' };
    }

    const desafioId = body?.desafioId?.trim();
    if (!desafioId) {
      return { ok: false, message: 'Se requiere desafioId' };
    }

    const participacion =
      await this.participacionesService.obtenerParticipacionActiva(
        desafioId,
        usuarioId,
      );
    if (!participacion) {
      return {
        ok: false,
        message: 'Solo podés suscribirte a desafíos en los que participás',
      };
    }

    await client.join(salaDesafio(desafioId));
    return { ok: true };
  }

  @SubscribeMessage(REALTIME_EVENT.DESAFIO_DESUSCRIBIR)
  async desuscribirDesafio(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SuscribirPayload,
  ): Promise<SuscribirAck> {
    const desafioId = body?.desafioId?.trim();
    if (!desafioId) {
      return { ok: false, message: 'Se requiere desafioId' };
    }

    await client.leave(salaDesafio(desafioId));
    return { ok: true };
  }

  @SubscribeMessage(REALTIME_EVENT.ALIENTO_ENVIAR)
  async enviarAliento(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: EnviarAlientoPayload,
  ): Promise<SuscribirAck> {
    const data = client.data as SocketData;
    const usuarioId = data.usuarioId;
    const remitenteAlias = data.alias;
    if (!usuarioId || !remitenteAlias) {
      return { ok: false, message: 'Conexión no autenticada' };
    }

    const desafioId = body?.desafioId?.trim();
    const destinatarioUsuarioId = body?.destinatarioUsuarioId?.trim();
    const emojiId = body?.emojiId?.trim();

    if (!desafioId || !destinatarioUsuarioId || !emojiId) {
      return {
        ok: false,
        message: 'Se requieren desafioId, destinatarioUsuarioId y emojiId',
      };
    }

    if (!esAlientoEmojiValido(emojiId)) {
      return { ok: false, message: 'Emoji de aliento no válido' };
    }

    if (destinatarioUsuarioId === usuarioId) {
      return { ok: false, message: 'No podés enviarte un aliento a vos mismo' };
    }

    const participacionRemitente =
      await this.participacionesService.obtenerParticipacionActiva(
        desafioId,
        usuarioId,
      );
    if (!participacionRemitente) {
      return {
        ok: false,
        message: 'Solo podés enviar alientos en desafíos en los que participás',
      };
    }

    const participacionDestinatario =
      await this.participacionesService.obtenerParticipacionActiva(
        desafioId,
        destinatarioUsuarioId,
      );
    if (!participacionDestinatario) {
      return {
        ok: false,
        message: 'El destinatario no participa de este desafío',
      };
    }

    const sala = salaDesafio(desafioId);
    if (!client.rooms.has(sala)) {
      await client.join(sala);
    }

    if (!this.alientoRateLimitService.intentar(usuarioId, desafioId)) {
      return {
        ok: false,
        message: 'Esperá unos segundos antes de enviar otro aliento',
      };
    }

    this.server.to(sala).emit(REALTIME_EVENT.ALIENTO_RECIBIDO, {
      desafioId,
      destinatarioUsuarioId,
      remitenteUsuarioId: usuarioId,
      remitenteAlias,
      emojiId,
      emoji: emojiDeAliento(emojiId),
    });

    return { ok: true };
  }
}
