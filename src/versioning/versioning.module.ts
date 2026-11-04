import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DesafiosModule } from '../desafios/desafios.module';
import { CheckInsModule } from '../check-ins/check-ins.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ParticipacionesModule } from '../participaciones/participaciones.module';
import { GamificacionModule } from '../gamificacion/gamificacion.module';
import {
  CheckInsV1Controller,
  DesafiosV1Controller,
  UsuariosV1Controller,
} from './v1.controllers';
import { VersionPolicyController } from './version-policy.controller';
import { AppVersionGuard } from './app-version.guard';
import { V1DeprecationInterceptor } from './v1-deprecation.interceptor';

@Module({
  imports: [
    DesafiosModule,
    CheckInsModule,
    UsuariosModule,
    ParticipacionesModule,
    GamificacionModule,
  ],
  controllers: [
    VersionPolicyController,
    DesafiosV1Controller,
    CheckInsV1Controller,
    UsuariosV1Controller,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppVersionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: V1DeprecationInterceptor,
    },
  ],
})
export class VersioningModule {}
