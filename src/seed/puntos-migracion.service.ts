import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SeedMetadata,
  SeedMetadataDocument,
} from './schemas/seed-metadata.schema';
import { CheckIn, CheckInDocument } from '../check-ins/schemas/check-in.schema';
import { RachaPuntosService } from '../common/services/racha-puntos.service';

const CLAVE_MIGRACION_PUNTOS = 'parte-2-puntos';

@Injectable()
export class PuntosMigracionService implements OnModuleInit {
  private readonly logger = new Logger(PuntosMigracionService.name);

  constructor(
    @InjectModel(SeedMetadata.name)
    private readonly seedMetadataModel: Model<SeedMetadataDocument>,
    @InjectModel(CheckIn.name)
    private readonly checkInModel: Model<CheckInDocument>,
    private readonly rachaPuntosService: RachaPuntosService,
  ) {}

  async onModuleInit() {
    const existente = await this.seedMetadataModel.findOne({
      clave: CLAVE_MIGRACION_PUNTOS,
    });
    if (existente) {
      return;
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
      checkIn.puntos = this.rachaPuntosService.calcularPuntosCheckIn(racha);
      await checkIn.save();
    }

    await this.seedMetadataModel.create({ clave: CLAVE_MIGRACION_PUNTOS });
    this.logger.log('Migración de puntos completada.');
  }
}
