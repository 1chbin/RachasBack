import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckIn, CheckInSchema } from '../check-ins/schemas/check-in.schema';
import { GamificacionService } from './gamificacion.service';
import { ParticipacionesModule } from '../participaciones/participaciones.module';
import { DesafiosModule } from '../desafios/desafios.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CheckIn.name, schema: CheckInSchema }]),
    forwardRef(() => ParticipacionesModule),
    forwardRef(() => DesafiosModule),
    forwardRef(() => UsuariosModule),
  ],
  providers: [GamificacionService],
  exports: [GamificacionService],
})
export class GamificacionModule {}
