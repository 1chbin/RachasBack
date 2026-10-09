import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { UsuarioIdGuard } from '../common/guards/usuario-id.guard';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { DesafiosService } from '../desafios/desafios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly desafiosService: DesafiosService,
  ) {}

  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  @Get()
  listarTodos() {
    return this.usuariosService.listarTodos();
  }

  @Get(':id/desafios')
  listarDesafiosDeUsuario(@Param('id') id: string) {
    return this.desafiosService.listarPorParticipante(id);
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.usuariosService.obtenerPorId(id);
  }

  @Patch(':id')
  @UseGuards(UsuarioIdGuard)
  actualizar(
    @Param('id') id: string,
    @UsuarioId() usuarioId: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    if (id !== usuarioId) {
      throw new ForbiddenException('Solo podés modificar tu propio perfil');
    }
    return this.usuariosService.actualizar(id, dto);
  }
}
