import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckIn, CheckInDocument } from './schemas/check-in.schema';
import { CrearCheckInDto } from './dto/crear-check-in.dto';
import { CrearCheckInV1Dto } from './dto/crear-check-in-v1.dto';
import { DesafiosService } from '../desafios/desafios.service';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EstadoDesafio } from '../common/enums/estado-desafio.enum';
import {
  esFechaCalendarioValida,
  esZonaHorariaIanaValida,
  obtenerFechaCalendarioAyer,
  obtenerFechaCalendarioHoy,
} from '../common/utils/fechas.util';
import { serializarDocumento } from '../common/utils/serializar.util';
import { lanzarSiDuplicado } from '../common/utils/errores-mongo.util';
import { RachaPuntosService } from '../common/services/racha-puntos.service';
import { PaginacionQueryDto } from '../common/dto/paginacion-query.dto';
import { paginarArray } from '../common/utils/paginacion.util';
import { obtenerDesafiosRealtimeService } from '../realtime/realtime-lazy.util';

@Injectable()
export class CheckInsService {
  constructor(
    @InjectModel(CheckIn.name)
    private readonly checkInModel: Model<CheckInDocument>,
    private readonly desafiosService: DesafiosService,
    private readonly participacionesService: ParticipacionesService,
    private readonly usuariosService: UsuariosService,
    private readonly rachaPuntosService: RachaPuntosService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async registrar(desafioId: string, usuarioId: string, dto: CrearCheckInDto) {
    return this.registrarInternal(desafioId, usuarioId, dto);
  }

  async registrarV1(desafioId: string, usuarioId: string, dto: CrearCheckInV1Dto) {
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    return this.registrarInternal(desafioId, usuarioId, {
      ...dto,
      zonaHoraria: usuario.zonaHoraria,
    });
  }

  private async registrarInternal(
    desafioId: string,
    usuarioId: string,
    dto: CrearCheckInDto,
  ) {
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    const desafio = await this.desafiosService.obtenerDocumentoPorId(desafioId);
    const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);

    if (estado !== EstadoDesafio.ACTIVO) {
      throw new ConflictException(
        estado === EstadoDesafio.PAUSADO
          ? 'No podés registrar check-ins mientras el desafío está pausado'
          : 'Solo podés registrar check-ins en desafíos activos',
      );
    }

    const zonaHoraria = dto.zonaHoraria.trim();
    if (!esZonaHorariaIanaValida(zonaHoraria)) {
      throw new BadRequestException('zonaHoraria debe ser un identificador IANA válido');
    }

    const participacion =
      await this.participacionesService.obtenerParticipacionActiva(
        desafioId,
        usuarioId,
      );
    if (!participacion) {
      throw new ForbiddenException('No participás activamente en este desafío');
    }

    if (!esFechaCalendarioValida(dto.dia)) {
      throw new BadRequestException('El día del check-in no es válido');
    }

    const hoy = obtenerFechaCalendarioHoy(zonaHoraria);
    const ayer = obtenerFechaCalendarioAyer(zonaHoraria);

    if (dto.dia !== hoy && dto.dia !== ayer) {
      throw new BadRequestException(
        'Solo podés registrar el check-in de hoy o de ayer',
      );
    }

    if (dto.dia < desafio.fechaInicio || dto.dia > desafio.finalizaEn) {
      throw new BadRequestException(
        'El día del check-in debe estar dentro del rango del desafío',
      );
    }

    const diasExistentes = await this.listarDiasCheckIn(desafioId, usuarioId);
    const diasConNuevo = [...diasExistentes, dto.dia];
    const rachaIncluyendoDia = this.rachaPuntosService.calcularRachaEnDia(
      diasConNuevo,
      dto.dia,
    );
    const puntos = this.rachaPuntosService.calcularDesglosePuntosCheckIn(
      rachaIncluyendoDia,
    );

    try {
      const checkIn = await this.checkInModel.create({
        desafioId: desafio._id,
        usuarioId: new Types.ObjectId(usuarioId),
        dia: dto.dia,
        nota: dto.nota?.trim(),
        valor: dto.valor,
        zonaHorariaUsada: zonaHoraria,
        puntos,
      });
      const serializado = serializarDocumento(checkIn);
      const realtime = obtenerDesafiosRealtimeService(this.moduleRef);
      await realtime.emitirCheckInRegistrado(desafioId, {
        checkIn: serializado,
        usuarioId,
        alias: usuario.alias,
      });
      return serializado;
    } catch (error) {
      lanzarSiDuplicado(
        error,
        'Ya registraste un check-in para ese día en este desafío',
      );
      throw error;
    }
  }

  async deshacerUltimo(desafioId: string, usuarioId: string) {
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    await this.desafiosService.obtenerDocumentoPorId(desafioId);

    const participacion =
      await this.participacionesService.obtenerParticipacionActiva(
        desafioId,
        usuarioId,
      );
    if (!participacion) {
      throw new ForbiddenException('No participás activamente en este desafío');
    }

    const ultimo = await this.checkInModel
      .findOne({
        desafioId: new Types.ObjectId(desafioId),
        usuarioId: new Types.ObjectId(usuarioId),
      })
      .sort({ creadoEn: -1 });

    if (!ultimo) {
      throw new NotFoundException('No tenés check-ins para deshacer');
    }

    const hoy = obtenerFechaCalendarioHoy(usuario.zonaHoraria);
    if (ultimo.dia !== hoy) {
      throw new BadRequestException(
        'Solo podés deshacer el último check-in si corresponde al día de hoy',
      );
    }

    const diaDeshecho = ultimo.dia;
    await ultimo.deleteOne();
    const realtime = obtenerDesafiosRealtimeService(this.moduleRef);
    await realtime.emitirCheckInDeshecho(desafioId, {
      usuarioId,
      dia: diaDeshecho,
    });
    return { mensaje: 'Check-in deshecho correctamente' };
  }

  async listarPorDesafioYUsuario(
    desafioId: string,
    usuarioIdConsulta: string,
    paginacion: PaginacionQueryDto,
  ) {
    await this.desafiosService.obtenerDocumentoPorId(desafioId);
    await this.usuariosService.obtenerDocumentoPorId(usuarioIdConsulta);

    const page = paginacion.page ?? 1;
    const limit = paginacion.limit ?? 20;

    const checkIns = await this.checkInModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        usuarioId: new Types.ObjectId(usuarioIdConsulta),
      })
      .sort({ dia: -1, creadoEn: -1 });

    const serializados = checkIns.map((checkIn) => serializarDocumento(checkIn));
    return paginarArray(serializados, page, limit);
  }

  private async listarDiasCheckIn(
    desafioId: string,
    usuarioId: string,
  ): Promise<string[]> {
    const checkIns = await this.checkInModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        usuarioId: new Types.ObjectId(usuarioId),
      })
      .select('dia')
      .lean();
    return checkIns.map((checkIn) => checkIn.dia);
  }
}
