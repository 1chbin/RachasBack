import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ActualizarAliasDto } from './dto/actualizar-alias.dto';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { DesafiosService } from '../desafios/desafios.service';
import { GamificacionService } from '../gamificacion/gamificacion.service';
import { AuthUsuarioService } from '../auth/auth-usuario.service';

@Controller({ path: 'usuarios', version: '2' })
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authUsuarioService: AuthUsuarioService,
    private readonly desafiosService: DesafiosService,
    private readonly gamificacionService: GamificacionService,
  ) {}

  @Get('me')
  obtenerMe(@UsuarioId() usuarioId: string) {
    return this.usuariosService.obtenerPerfilAutenticado(usuarioId);
  }

  @Get('me/inicio')
  obtenerResumenInicio(@UsuarioId() usuarioId: string) {
    return this.gamificacionService.obtenerResumenInicio(usuarioId);
  }

  @Get('me/desafios')
  listarMisDesafios(@UsuarioId() usuarioId: string) {
    return this.desafiosService.listarPorParticipante(usuarioId);
  }

  @Patch('me')
  actualizarMe(
    @UsuarioId() usuarioId: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizar(usuarioId, dto);
  }

  @Patch('me/alias')
  actualizarAlias(
    @UsuarioId() usuarioId: string,
    @Body() dto: ActualizarAliasDto,
  ) {
    return this.authUsuarioService.actualizarAlias(usuarioId, dto);
  }
}
