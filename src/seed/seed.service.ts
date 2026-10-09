import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema';
import { Desafio, DesafioDocument } from '../desafios/schemas/desafio.schema';
import {
  Participacion,
  ParticipacionDocument,
} from '../participaciones/schemas/participacion.schema';
import {
  SeedMetadata,
  SeedMetadataDocument,
} from './schemas/seed-metadata.schema';
import { CategoriaDesafio } from '../common/enums/categoria-desafio.enum';
import { ZONA_HORARIA_DEFAULT } from '../common/constants/zona-horaria-default';
import { addDays, format } from 'date-fns';

const CLAVE_SEED = 'parte-1';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(SeedMetadata.name)
    private readonly seedMetadataModel: Model<SeedMetadataDocument>,
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Desafio.name)
    private readonly desafioModel: Model<DesafioDocument>,
    @InjectModel(Participacion.name)
    private readonly participacionModel: Model<ParticipacionDocument>,
  ) {}

  async onModuleInit() {
    const existente = await this.seedMetadataModel.findOne({ clave: CLAVE_SEED });
    if (existente) {
      return;
    }

    this.logger.log('Cargando datos de prueba (Parte I)...');

    const usuarios = await this.usuarioModel.insertMany([
      {
        nombre: 'Lucía Fernández',
        alias: 'lucia_fit',
        email: 'lucia@ejemplo.com',
        zonaHoraria: ZONA_HORARIA_DEFAULT,
      },
      {
        nombre: 'Martín Gómez',
        alias: 'martin_estudio',
        email: 'martin@ejemplo.com',
        zonaHoraria: ZONA_HORARIA_DEFAULT,
      },
      {
        nombre: 'Sofía Ruiz',
        alias: 'sofia_racha',
        email: 'sofia@ejemplo.com',
        zonaHoraria: ZONA_HORARIA_DEFAULT,
      },
    ]);

    const [lucia, martin, sofia] = usuarios;
    const hoy = new Date();
    const enTresDias = format(addDays(hoy, 3), 'yyyy-MM-dd');
    const enDiezDias = format(addDays(hoy, 10), 'yyyy-MM-dd');
    const enUnDia = format(addDays(hoy, 1), 'yyyy-MM-dd');
    const enQuinceDias = format(addDays(hoy, 15), 'yyyy-MM-dd');

    const desafios = await this.desafioModel.insertMany([
      {
        nombre: 'Correr 3 veces por semana',
        descripcion: 'Salir a correr al menos 30 minutos.',
        categoria: CategoriaDesafio.SALUD,
        fechaInicio: enUnDia,
        fechaFin: enQuinceDias,
        maxParticipantes: 10,
        codigoInvitacion: 'RACH01',
        creadorId: lucia._id,
        cancelado: false,
      },
      {
        nombre: 'Una hora de estudio diaria',
        categoria: CategoriaDesafio.ESTUDIO,
        fechaInicio: enTresDias,
        fechaFin: enDiezDias,
        maxParticipantes: 5,
        codigoInvitacion: 'ESTU02',
        creadorId: martin._id,
        cancelado: false,
      },
    ]);

    const [desafioSalud, desafioEstudio] = desafios;

    await this.participacionModel.insertMany([
      { desafioId: desafioSalud._id, usuarioId: lucia._id },
      { desafioId: desafioSalud._id, usuarioId: sofia._id },
      { desafioId: desafioEstudio._id, usuarioId: martin._id },
    ]);

    await this.seedMetadataModel.create({ clave: CLAVE_SEED });
    this.logger.log('Datos de prueba cargados.');
  }
}
