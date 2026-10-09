import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Participacion,
  ParticipacionSchema,
} from './schemas/participacion.schema';
import { ParticipacionesService } from './participaciones.service';
import { DesafiosModule } from '../desafios/desafios.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participacion.name, schema: ParticipacionSchema },
    ]),
    forwardRef(() => DesafiosModule),
    forwardRef(() => UsuariosModule),
  ],
  providers: [ParticipacionesService],
  exports: [ParticipacionesService],
})
export class ParticipacionesModule {}
