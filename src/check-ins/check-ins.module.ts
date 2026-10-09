import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckIn, CheckInSchema } from './schemas/check-in.schema';
import { CheckInsService } from './check-ins.service';
import { CheckInsController } from './check-ins.controller';
import { DesafiosModule } from '../desafios/desafios.module';
import { ParticipacionesModule } from '../participaciones/participaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CheckIn.name, schema: CheckInSchema }]),
    DesafiosModule,
    ParticipacionesModule,
    UsuariosModule,
  ],
  controllers: [CheckInsController],
  providers: [CheckInsService],
})
export class CheckInsModule {}
