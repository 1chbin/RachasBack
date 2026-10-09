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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeedMetadata.name, schema: SeedMetadataSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Desafio.name, schema: DesafioSchema },
      { name: Participacion.name, schema: ParticipacionSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
