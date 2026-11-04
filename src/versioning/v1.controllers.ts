import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUsuarioService } from '../auth/auth-usuario.service';
import { CheckInsService } from '../check-ins/check-ins.service';
import { CrearCheckInV1Dto } from '../check-ins/dto/crear-check-in-v1.dto';
import { ListarCheckInsQueryDto } from '../check-ins/dto/listar-check-ins-query.dto';
import { OptionalUsuarioId } from '../common/decorators/optional-usuario-id.decorator';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { GamificacionService } from '../gamificacion/gamificacion.service';
import { ActualizarDesafioV1Dto } from '../desafios/dto/actualizar-desafio-v1.dto';
import { CrearDesafioV1Dto } from '../desafios/dto/crear-desafio-v1.dto';
import { ActualizarDesafioDto } from '../desafios/dto/actualizar-desafio.dto';
import { CrearDesafioDto } from '../desafios/dto/crear-desafio.dto';
import { ListarDesafiosQueryDto } from '../desafios/dto/listar-desafios-query.dto';
import { UnirseDesafioDto } from '../desafios/dto/unirse-desafio.dto';
import { DesafiosService } from '../desafios/desafios.service';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { ActualizarAliasDto } from '../usuarios/dto/actualizar-alias.dto';
import { ActualizarUsuarioDto } from '../usuarios/dto/actualizar-usuario.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import {
  mapCheckInV1,
  mapDesafioV1,
  mapPaginatedCheckInsV1,
  mapPaginatedDesafiosV1,
  mapRankingResponseV1,
  mapResumenInicioV1,
} from './api-v1.mapper';

function mapDeepParticipacion(result: unknown) {
  if (!result || typeof result !== 'object') {
    return result;
  }
  const record = result as Record<string, unknown>;
  if (record.desafio) {
    return {
      ...record,
      desafio: mapDesafioV1(record.desafio as Record<string, unknown>),
    };
  }
  return result;
}

@Controller({ path: 'desafios', version: '1' })
export class DesafiosV1Controller {
  constructor(
    private readonly desafiosService: DesafiosService,
    private readonly participacionesService: ParticipacionesService,
    private readonly gamificacionService: GamificacionService,
  ) {}

  @Get()
  async listar(@Query() query: ListarDesafiosQueryDto) {
    const result = await this.desafiosService.listar(query);
    return mapPaginatedDesafiosV1(result as Record<string, unknown>);
  }

  @Post('unirse')
  async unirse(@Body() dto: UnirseDesafioDto, @UsuarioId() usuarioId: string) {
    const result = await this.participacionesService.unirse(
      dto.codigoInvitacion.toUpperCase(),
      usuarioId,
    );
    return mapDeepParticipacion(result);
  }

  @Post()
  async crear(@Body() dto: CrearDesafioV1Dto, @UsuarioId() usuarioId: string) {
    const v2Dto: CrearDesafioDto = {
      ...dto,
      finalizaEn: dto.fechaFin,
    };
    const result = await this.desafiosService.crear(v2Dto, usuarioId);
    return mapDesafioV1(result as Record<string, unknown>);
  }

  @Get(':id/ranking')
  async obtenerRanking(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    const result = await this.gamificacionService.obtenerRanking(id, usuarioId);
    return mapRankingResponseV1(result as Record<string, unknown>);
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
  async cancelar(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    const result = await this.desafiosService.cancelar(id, usuarioId);
    return mapDesafioV1(result as Record<string, unknown>);
  }

  @Get(':id')
  async obtenerPorId(
    @Param('id') id: string,
    @OptionalUsuarioId() usuarioId?: string,
  ) {
    const result = await this.desafiosService.obtenerPorId(id, usuarioId);
    return mapDesafioV1(result as Record<string, unknown>);
  }

  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarDesafioV1Dto,
    @UsuarioId() usuarioId: string,
  ) {
    const v2Dto: ActualizarDesafioDto = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      fechaInicio: dto.fechaInicio,
      finalizaEn: dto.fechaFin,
      maxParticipantes: dto.maxParticipantes,
    };
    const result = await this.desafiosService.actualizar(id, v2Dto, usuarioId);
    return mapDesafioV1(result as Record<string, unknown>);
  }
}

@Controller({ path: 'desafios/:desafioId/check-ins', version: '1' })
export class CheckInsV1Controller {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  async registrar(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
    @Body() dto: CrearCheckInV1Dto,
  ) {
    const result = await this.checkInsService.registrarV1(
      desafioId,
      usuarioId,
      dto,
    );
    return mapCheckInV1(result as Record<string, unknown>);
  }

  @Delete('ultimo')
  async deshacerUltimo(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
  ) {
    const result = await this.checkInsService.deshacerUltimo(desafioId, usuarioId);
    if (result && typeof result === 'object') {
      return mapCheckInV1(result as Record<string, unknown>);
    }
    return result;
  }

  @Get()
  async listar(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
    @Query() query: ListarCheckInsQueryDto,
  ) {
    const result = await this.checkInsService.listarPorDesafioYUsuario(
      desafioId,
      usuarioId,
      query,
    );
    return mapPaginatedCheckInsV1(result as Record<string, unknown>);
  }
}

@Controller({ path: 'usuarios', version: '1' })
export class UsuariosV1Controller {
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
  async obtenerResumenInicio(@UsuarioId() usuarioId: string) {
    const result = await this.gamificacionService.obtenerResumenInicio(usuarioId);
    return mapResumenInicioV1(result as Record<string, unknown>);
  }

  @Get('me/desafios')
  async listarMisDesafios(@UsuarioId() usuarioId: string) {
    const result = await this.desafiosService.listarPorParticipante(usuarioId);
    return (result as Record<string, unknown>[]).map((d) => mapDesafioV1(d));
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
