import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ParticipacionesModule } from '../participaciones/participaciones.module';
import { GamificacionModule } from '../gamificacion/gamificacion.module';
import { DesafiosGateway } from './desafios.gateway';
import { DesafiosRealtimeService } from './desafios-realtime.service';
import { DESAFIOS_REALTIME_SERVICE } from './realtime.tokens';

@Global()
@Module({
  imports: [
    AuthModule,
    forwardRef(() => ParticipacionesModule),
    forwardRef(() => GamificacionModule),
  ],
  providers: [
    DesafiosGateway,
    DesafiosRealtimeService,
    {
      provide: DESAFIOS_REALTIME_SERVICE,
      useExisting: DesafiosRealtimeService,
    },
  ],
  exports: [DesafiosRealtimeService, DESAFIOS_REALTIME_SERVICE],
})
export class RealtimeModule {}
