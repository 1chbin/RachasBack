import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { DesafiosModule } from './desafios/desafios.module';
import { ParticipacionesModule } from './participaciones/participaciones.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { GamificacionModule } from './gamificacion/gamificacion.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    CommonModule,
    UsuariosModule,
    DesafiosModule,
    ParticipacionesModule,
    CheckInsModule,
    GamificacionModule,
    RealtimeModule,
    SeedModule,
  ],
})
export class AppModule {}
