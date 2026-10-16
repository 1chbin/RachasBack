import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import {
  SeedMetadata,
  SeedMetadataSchema,
} from './schemas/seed-metadata.schema';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { Desafio, DesafioSchema } from '../desafios/schemas/desafio.schema';
import {
  Participacion,
  ParticipacionSchema,
} from '../participaciones/schemas/participacion.schema';
import { CheckIn, CheckInSchema } from '../check-ins/schemas/check-in.schema';
import { PuntosMigracionService } from './puntos-migracion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeedMetadata.name, schema: SeedMetadataSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Desafio.name, schema: DesafioSchema },
      { name: Participacion.name, schema: ParticipacionSchema },
      { name: CheckIn.name, schema: CheckInSchema },
    ]),
  ],
  providers: [SeedService, PuntosMigracionService],
})
export class SeedModule {}
