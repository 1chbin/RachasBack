import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Desafio, DesafioSchema } from './schemas/desafio.schema';
import { DesafiosService } from './desafios.service';
import { DesafiosController } from './desafios.controller';
import { ParticipacionesModule } from '../participaciones/participaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Desafio.name, schema: DesafioSchema }]),
    forwardRef(() => ParticipacionesModule),
    forwardRef(() => UsuariosModule),
  ],
  controllers: [DesafiosController],
  providers: [DesafiosService],
  exports: [DesafiosService],
})
export class DesafiosModule {}
