import { Global, Module } from '@nestjs/common';
import { EstadoDesafioService } from './services/estado-desafio.service';
import { CodigoInvitacionService } from './services/codigo-invitacion.service';
import { UsuarioIdGuard } from './guards/usuario-id.guard';

@Global()
@Module({
  providers: [EstadoDesafioService, CodigoInvitacionService, UsuarioIdGuard],
  exports: [EstadoDesafioService, CodigoInvitacionService, UsuarioIdGuard],
})
export class CommonModule {}
