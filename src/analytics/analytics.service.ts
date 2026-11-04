import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClientError,
  ClientErrorDocument,
  EventoUso,
  EventoUsoDocument,
} from './schemas/analytics.schema';
import { EventoUsoDto, ReportarErrorClienteDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(EventoUso.name)
    private readonly eventoModel: Model<EventoUsoDocument>,
    @InjectModel(ClientError.name)
    private readonly errorModel: Model<ClientErrorDocument>,
  ) {}

  async ingestarLote(
    eventos: EventoUsoDto[],
    meta: { usuarioId?: string; appVersion?: string; platform?: string },
  ) {
    if (eventos.length === 0) {
      return { insertados: 0 };
    }
    await this.eventoModel.insertMany(
      eventos.map((evento) => ({
        nombre: evento.nombre,
        propiedades: evento.propiedades ?? {},
        usuarioId: meta.usuarioId,
        appVersion: meta.appVersion,
        platform: meta.platform,
        ocurrioEn: new Date(evento.ocurrioEn),
      })),
    );
    return { insertados: eventos.length };
  }

  async reportarErrorCliente(
    dto: ReportarErrorClienteDto,
    meta: { appVersion?: string; platform?: string },
  ) {
    await this.errorModel.create({
      mensaje: dto.mensaje.slice(0, 2000),
      pantalla: dto.pantalla,
      appVersion: meta.appVersion,
      platform: meta.platform,
      requestId: dto.requestId,
    });
    return { ok: true };
  }

  async personasActivasPorDia() {
    return this.eventoModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$ocurrioEn' },
          },
          usuarios: { $addToSet: '$usuarioId' },
        },
      },
      {
        $project: {
          dia: '$_id',
          activos: { $size: '$usuarios' },
          _id: 0,
        },
      },
      { $sort: { dia: 1 } },
    ]);
  }
}
