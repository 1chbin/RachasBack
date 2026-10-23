import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { FirebaseAuthService } from './firebase-auth.service';
import { AuthUsuarioService } from './auth-usuario.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  providers: [
    FirebaseAuthService,
    AuthUsuarioService,
    FirebaseAuthGuard,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseAuthService, AuthUsuarioService],
})
export class AuthModule {}
