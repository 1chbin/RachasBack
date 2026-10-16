import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckIn, CheckInDocument } from '../check-ins/schemas/check-in.schema';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { DesafiosService } from '../desafios/desafios.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RachaPuntosService } from '../common/services/racha-puntos.service';
import { EstadoDesafio } from '../common/enums/estado-desafio.enum';
import { EstadoDesafioService } from '../common/services/estado-desafio.service';
import { obtenerFechaCalendarioHoy } from '../common/utils/fechas.util';

export interface FilaRanking {
  posicion: number;
  usuarioId: string;
  alias: string;
  puntosTotales: number;
  rachaActual: number;
}

@Injectable()
export class GamificacionService {
  constructor(
    @InjectModel(CheckIn.name)
    private readonly checkInModel: Model<CheckInDocument>,
    private readonly participacionesService: ParticipacionesService,
    private readonly desafiosService: DesafiosService,
    private readonly usuariosService: UsuariosService,
    private readonly rachaPuntosService: RachaPuntosService,
    private readonly estadoDesafioService: EstadoDesafioService,
  ) {}

  async obtenerRachaDeUsuario(desafioId: string, usuarioId: string) {
    await this.participacionesService.assertParticipacionActiva(
      desafioId,
      usuarioId,
    );
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    const dias = await this.listarDiasCheckIn(desafioId, usuarioId);

    return {
      rachaActual: this.rachaPuntosService.calcularRachaActual(
        dias,
        usuario.zonaHoraria,
      ),
      mejorRacha: this.rachaPuntosService.calcularMejorRacha(dias),
    };
  }

  async obtenerRanking(desafioId: string, usuarioId: string) {
    await this.participacionesService.assertParticipacionActiva(
      desafioId,
      usuarioId,
    );

    const desafio = await this.desafiosService.obtenerDocumentoPorId(desafioId);
    const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);
    const filas = await this.construirFilasRanking(desafioId);

    const respuesta: {
      desafioId: string;
      estado: EstadoDesafio;
      ranking: FilaRanking[];
      ganador?: FilaRanking;
    } = {
      desafioId,
      estado,
      ranking: filas,
    };

    if (estado === EstadoDesafio.FINALIZADO && filas.length > 0) {
      respuesta.ganador = filas[0];
    }

    return respuesta;
  }

  async obtenerResumenInicio(usuarioId: string) {
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    const hoy = obtenerFechaCalendarioHoy(usuario.zonaHoraria);
    const desafioIds =
      await this.participacionesService.listarDesafioIdsPorUsuario(usuarioId);

    const items: Array<{
      desafio: Record<string, unknown>;
      rachaActual: number;
      mejorRacha: number;
      posicion: number;
      puntosTotales: number;
      checkInHoy: boolean;
    }> = [];

    for (const desafioId of desafioIds) {
      const desafio =
        await this.desafiosService.obtenerDocumentoPorId(desafioId);
      const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);
      if (!this.estadoDesafioService.esVigente(estado)) {
        continue;
      }

      const dias = await this.listarDiasCheckIn(desafioId, usuarioId);
      const puntosTotales = await this.sumarPuntosUsuario(desafioId, usuarioId);
      const filas = await this.construirFilasRanking(desafioId);
      const filaUsuario = filas.find((fila) => fila.usuarioId === usuarioId);

      items.push({
        desafio: this.desafiosService.presentarDetalleParticipante(desafio),
        rachaActual: this.rachaPuntosService.calcularRachaActual(
          dias,
          usuario.zonaHoraria,
        ),
        mejorRacha: this.rachaPuntosService.calcularMejorRacha(dias),
        posicion: filaUsuario?.posicion ?? filas.length + 1,
        puntosTotales,
        checkInHoy: dias.includes(hoy),
      });
    }

    return { desafios: items };
  }

  private async construirFilasRanking(
    desafioId: string,
  ): Promise<FilaRanking[]> {
    const participantes =
      await this.participacionesService.listarParticipantesActivosInterno(
        desafioId,
      );

    const puntosPorUsuario = await this.agregarPuntosPorDesafio(desafioId);

    const filasSinPosicion = await Promise.all(
      participantes.map(async (participante) => {
        const dias = await this.listarDiasCheckIn(
          desafioId,
          participante.usuarioId,
        );
        const usuario = await this.usuariosService.obtenerDocumentoPorId(
          participante.usuarioId,
        );
        return {
          usuarioId: participante.usuarioId,
          alias: usuario.alias,
          puntosTotales: puntosPorUsuario.get(participante.usuarioId) ?? 0,
          rachaActual: this.rachaPuntosService.calcularRachaActual(
            dias,
            usuario.zonaHoraria,
          ),
        };
      }),
    );

    filasSinPosicion.sort((a, b) => {
      if (b.puntosTotales !== a.puntosTotales) {
        return b.puntosTotales - a.puntosTotales;
      }
      if (b.rachaActual !== a.rachaActual) {
        return b.rachaActual - a.rachaActual;
      }
      return a.alias.localeCompare(b.alias);
    });

    return filasSinPosicion.map((fila, indice) => ({
      posicion: indice + 1,
      ...fila,
    }));
  }

  private async listarDiasCheckIn(
    desafioId: string,
    usuarioId: string,
  ): Promise<string[]> {
    const checkIns = await this.checkInModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        usuarioId: new Types.ObjectId(usuarioId),
      })
      .select('dia')
      .lean();
    return checkIns.map((checkIn) => checkIn.dia);
  }

  async sumarPuntosUsuario(desafioId: string, usuarioId: string): Promise<number> {
    const resultado = await this.checkInModel.aggregate<{ total: number }>([
      {
        $match: {
          desafioId: new Types.ObjectId(desafioId),
          usuarioId: new Types.ObjectId(usuarioId),
        },
      },
      { $group: { _id: null, total: { $sum: '$puntos' } } },
    ]);
    return resultado[0]?.total ?? 0;
  }

  private async agregarPuntosPorDesafio(
    desafioId: string,
  ): Promise<Map<string, number>> {
    const filas = await this.checkInModel.aggregate<{
      _id: Types.ObjectId;
      total: number;
    }>([
      { $match: { desafioId: new Types.ObjectId(desafioId) } },
      { $group: { _id: '$usuarioId', total: { $sum: '$puntos' } } },
    ]);

    const mapa = new Map<string, number>();
    for (const fila of filas) {
      mapa.set(fila._id.toString(), fila.total);
    }
    return mapa;
  }
}
