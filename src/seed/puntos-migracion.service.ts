import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
  SeedMetadata,
  SeedMetadataDocument,
} from './schemas/seed-metadata.schema';
import { CheckIn, CheckInDocument } from '../check-ins/schemas/check-in.schema';
import { PuntosCheckIn } from '../check-ins/schemas/puntos-check-in.schema';
import { RachaPuntosService } from '../common/services/racha-puntos.service';

const CLAVE_MIGRACION_PUNTOS = 'parte-4-puntos-objeto';

@Injectable()
export class PuntosMigracionService implements OnModuleInit {
  private readonly logger = new Logger(PuntosMigracionService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(SeedMetadata.name)
    private readonly seedMetadataModel: Model<SeedMetadataDocument>,
    @InjectModel(CheckIn.name)
    private readonly checkInModel: Model<CheckInDocument>,
    private readonly rachaPuntosService: RachaPuntosService,
  ) {}

  async onModuleInit() {
    const run = () =>
      this.runMigracionIfNeeded().catch((error) => {
        this.logger.warn(
          'Migración de puntos omitida: MongoDB no disponible aún.',
          error instanceof Error ? error.message : error,
        );
      });

    if (this.connection.readyState === 1) {
      await run();
      return;
    }

    this.connection.once('connected', () => {
      void run();
    });
  }

  private async runMigracionIfNeeded() {
    const existente = await this.seedMetadataModel.findOne({
      clave: CLAVE_MIGRACION_PUNTOS,
    });
    if (existente) {
      return;
    }

    const legacyNumericos = await this.checkInModel
      .find({ puntos: { $type: 'double' } } as Record<string, unknown>)
      .exec();

    for (const checkIn of legacyNumericos) {
      const doc = checkIn as CheckInDocument & { puntos: number | PuntosCheckIn };
      if (typeof doc.puntos !== 'number') {
        continue;
      }
      const puntosLegacy = doc.puntos;
      const bonus = Math.max(0, puntosLegacy - 10);
      doc.puntos = { total: puntosLegacy, bonusPorRacha: bonus };
      await doc.save();
    }

    const sinPuntos = await this.checkInModel.find({
      $or: [{ puntos: { $exists: false } }, { puntos: null }],
    });

    if (sinPuntos.length === 0) {
      await this.seedMetadataModel.create({ clave: CLAVE_MIGRACION_PUNTOS });
      return;
    }

    this.logger.log(
      `Recalculando puntos en ${sinPuntos.length} check-in(s) existentes...`,
    );

    for (const checkIn of sinPuntos) {
      const desafioId = checkIn.desafioId.toString();
      const usuarioId = checkIn.usuarioId.toString();
      const todos = await this.checkInModel
        .find({
          desafioId: checkIn.desafioId,
          usuarioId: checkIn.usuarioId,
          puntos: { $exists: true, $ne: null },
        })
        .select('dia')
        .lean();
      const diasPrevios = todos.map((item) => item.dia);
      const diasConActual = [...diasPrevios, checkIn.dia];
      const racha = this.rachaPuntosService.calcularRachaEnDia(
        diasConActual,
        checkIn.dia,
      );
      checkIn.puntos = this.rachaPuntosService.calcularDesglosePuntosCheckIn(
        racha,
      );
      await checkIn.save();
    }

    await this.seedMetadataModel.create({ clave: CLAVE_MIGRACION_PUNTOS });
    this.logger.log('Migración de puntos completada.');
  }
}
