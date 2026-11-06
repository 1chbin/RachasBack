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

  /**
   * Embudo: ingreso_exitoso → primer desafío (creado o unión) → primer check-in.
   * Orden estricto por marca de tiempo mínima de cada tipo de evento por usuario.
   */
  async embudoIngresoDesafioCheckin() {
    const sinEvento = new Date(8640000000000000);

    const [result] = await this.eventoModel.aggregate<{
      usuarios_con_ingreso: number;
      usuarios_ingreso_antes_primer_desafio: number;
      usuarios_embudo_completo: number;
    }>([
      {
        $match: {
          usuarioId: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$usuarioId',
          minIngreso: {
            $min: {
              $cond: [
                { $eq: ['$nombre', 'ingreso_exitoso'] },
                '$ocurrioEn',
                sinEvento,
              ],
            },
          },
          minDesafio: {
            $min: {
              $cond: [
                { $in: ['$nombre', ['desafio_creado', 'desafio_unido']] },
                '$ocurrioEn',
                sinEvento,
              ],
            },
          },
          minCheckin: {
            $min: {
              $cond: [
                { $eq: ['$nombre', 'checkin_hecho'] },
                '$ocurrioEn',
                sinEvento,
              ],
            },
          },
        },
      },
      {
        $facet: {
          usuarios_con_ingreso: [
            { $match: { $expr: { $lt: ['$minIngreso', sinEvento] } } },
            { $count: 'n' },
          ],
          usuarios_ingreso_antes_primer_desafio: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $lt: ['$minIngreso', sinEvento] },
                    { $lt: ['$minDesafio', sinEvento] },
                    { $lt: ['$minIngreso', '$minDesafio'] },
                  ],
                },
              },
            },
            { $count: 'n' },
          ],
          usuarios_embudo_completo: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $lt: ['$minIngreso', sinEvento] },
                    { $lt: ['$minDesafio', sinEvento] },
                    { $lt: ['$minCheckin', sinEvento] },
                    { $lt: ['$minIngreso', '$minDesafio'] },
                    { $lt: ['$minDesafio', '$minCheckin'] },
                  ],
                },
              },
            },
            { $count: 'n' },
          ],
        },
      },
      {
        $project: {
          usuarios_con_ingreso: {
            $ifNull: [{ $arrayElemAt: ['$usuarios_con_ingreso.n', 0] }, 0],
          },
          usuarios_ingreso_antes_primer_desafio: {
            $ifNull: [
              { $arrayElemAt: ['$usuarios_ingreso_antes_primer_desafio.n', 0] },
              0,
            ],
          },
          usuarios_embudo_completo: {
            $ifNull: [{ $arrayElemAt: ['$usuarios_embudo_completo.n', 0] }, 0],
          },
        },
      },
    ]);

    return (
      result ?? {
        usuarios_con_ingreso: 0,
        usuarios_ingreso_antes_primer_desafio: 0,
        usuarios_embudo_completo: 0,
      }
    );
  }

  async checkinsPorVersionApp() {
    return this.eventoModel.aggregate([
      { $match: { nombre: 'checkin_hecho' } },
      {
        $group: {
          _id: { $ifNull: ['$appVersion', 'desconocido'] },
          total: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          app_version: '$_id',
          total: 1,
        },
      },
    ]);
  }
}
