import { Global, Module } from '@nestjs/common';
import { EstadoDesafioService } from './services/estado-desafio.service';
import { CodigoInvitacionService } from './services/codigo-invitacion.service';
import { RachaPuntosService } from './services/racha-puntos.service';
import { UsuarioIdGuard } from './guards/usuario-id.guard';

@Global()
@Module({
  providers: [
    EstadoDesafioService,
    CodigoInvitacionService,
    RachaPuntosService,
    UsuarioIdGuard,
  ],
  exports: [
    EstadoDesafioService,
    CodigoInvitacionService,
    RachaPuntosService,
    UsuarioIdGuard,
  ],
})
export class CommonModule {}
