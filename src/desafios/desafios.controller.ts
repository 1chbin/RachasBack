import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DesafiosService } from './desafios.service';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { ActualizarDesafioDto } from './dto/actualizar-desafio.dto';
import { ListarDesafiosQueryDto } from './dto/listar-desafios-query.dto';
import { UnirseDesafioDto } from './dto/unirse-desafio.dto';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { OptionalUsuarioId } from '../common/decorators/optional-usuario-id.decorator';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { GamificacionService } from '../gamificacion/gamificacion.service';

@Controller('desafios')
export class DesafiosController {
  constructor(
    private readonly desafiosService: DesafiosService,
    private readonly participacionesService: ParticipacionesService,
    private readonly gamificacionService: GamificacionService,
  ) {}

  @Get()
  listar(@Query() query: ListarDesafiosQueryDto) {
    return this.desafiosService.listar(query);
  }

  @Post('unirse')
  unirse(@Body() dto: UnirseDesafioDto, @UsuarioId() usuarioId: string) {
    return this.participacionesService.unirse(
      dto.codigoInvitacion.toUpperCase(),
      usuarioId,
    );
  }

  @Post()
  crear(@Body() dto: CrearDesafioDto, @UsuarioId() usuarioId: string) {
    return this.desafiosService.crear(dto, usuarioId);
  }

  @Get(':id/ranking')
  obtenerRanking(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.gamificacionService.obtenerRanking(id, usuarioId);
  }

  @Get(':id/racha')
  obtenerRacha(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.gamificacionService.obtenerRachaDeUsuario(id, usuarioId);
  }

  @Get(':id/participantes')
  listarParticipantes(
    @Param('id') id: string,
    @UsuarioId() usuarioId: string,
  ) {
    return this.participacionesService.listarParticipantesActivos(id, usuarioId);
  }

  @Post(':id/abandonar')
  abandonar(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.participacionesService.abandonar(id, usuarioId);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.desafiosService.cancelar(id, usuarioId);
  }

  @Get(':id')
  obtenerPorId(
    @Param('id') id: string,
    @OptionalUsuarioId() usuarioId?: string,
  ) {
    return this.desafiosService.obtenerPorId(id, usuarioId);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarDesafioDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.desafiosService.actualizar(id, dto, usuarioId);
  }
}
