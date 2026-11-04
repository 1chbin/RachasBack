import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { VersioningModule } from './versioning/versioning.module';
import { HealthModule } from './health/health.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        lazyConnection: true,
        serverSelectionTimeoutMS: 10_000,
        onConnectionCreate: (connection) => {
          connection.on('error', (error: Error) => {
            console.error(
              '[MongoDB] Error de conexión. Revisá Atlas → Network Access (IP actual) y MONGODB_URI:',
              error.message,
            );
          });
        },
      }),
    }),
    CommonModule,
    UsuariosModule,
    DesafiosModule,
    ParticipacionesModule,
    CheckInsModule,
    GamificacionModule,
    RealtimeModule,
    VersioningModule,
    HealthModule,
    AnalyticsModule,
    SeedModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
