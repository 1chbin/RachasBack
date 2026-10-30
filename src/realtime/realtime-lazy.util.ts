import { ModuleRef } from '@nestjs/core';
import type { DesafiosRealtimeService } from './desafios-realtime.service';
import { DESAFIOS_REALTIME_SERVICE } from './realtime.tokens';

export function obtenerDesafiosRealtimeService(
  moduleRef: ModuleRef,
): DesafiosRealtimeService {
  return moduleRef.get(DESAFIOS_REALTIME_SERVICE, { strict: false });
}
