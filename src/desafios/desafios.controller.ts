import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DesafiosService } from './desafios.service';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { ActualizarDesafioDto } from './dto/actualizar-desafio.dto';
import { ListarDesafiosQueryDto } from './dto/listar-desafios-query.dto';
import { UnirseDesafioDto } from './dto/unirse-desafio.dto';
import { UsuarioIdGuard } from '../common/guards/usuario-id.guard';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { OptionalUsuarioId } from '../common/decorators/optional-usuario-id.decorator';
import { ParticipacionesService } from '../participaciones/participaciones.service';

@Controller('desafios')
export class DesafiosController {
  constructor(
    private readonly desafiosService: DesafiosService,
    private readonly participacionesService: ParticipacionesService,
  ) {}

  @Get()
  listar(@Query() query: ListarDesafiosQueryDto) {
    return this.desafiosService.listar(query);
  }

  @Post('unirse')
  @UseGuards(UsuarioIdGuard)
  unirse(@Body() dto: UnirseDesafioDto, @UsuarioId() usuarioId: string) {
    return this.participacionesService.unirse(
      dto.codigoInvitacion.toUpperCase(),
      usuarioId,
    );
  }

  @Post()
  @UseGuards(UsuarioIdGuard)
  crear(@Body() dto: CrearDesafioDto, @UsuarioId() usuarioId: string) {
    return this.desafiosService.crear(dto, usuarioId);
  }

  @Get(':id/participantes')
  @UseGuards(UsuarioIdGuard)
  listarParticipantes(
    @Param('id') id: string,
    @UsuarioId() usuarioId: string,
  ) {
    return this.participacionesService.listarParticipantesActivos(id, usuarioId);
  }

  @Post(':id/abandonar')
  @UseGuards(UsuarioIdGuard)
  abandonar(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.participacionesService.abandonar(id, usuarioId);
  }

  @Post(':id/cancelar')
  @UseGuards(UsuarioIdGuard)
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
  @UseGuards(UsuarioIdGuard)
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarDesafioDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.desafiosService.actualizar(id, dto, usuarioId);
  }
}
