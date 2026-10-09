import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckIn, CheckInDocument } from './schemas/check-in.schema';
import { CrearCheckInDto } from './dto/crear-check-in.dto';
import { DesafiosService } from '../desafios/desafios.service';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EstadoDesafio } from '../common/enums/estado-desafio.enum';
import {
  esFechaCalendarioValida,
  obtenerFechaCalendarioAyer,
  obtenerFechaCalendarioHoy,
} from '../common/utils/fechas.util';
import { serializarDocumento } from '../common/utils/serializar.util';
import { lanzarSiDuplicado } from '../common/utils/errores-mongo.util';

@Injectable()
export class CheckInsService {
  constructor(
    @InjectModel(CheckIn.name)
    private readonly checkInModel: Model<CheckInDocument>,
    private readonly desafiosService: DesafiosService,
    private readonly participacionesService: ParticipacionesService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async registrar(desafioId: string, usuarioId: string, dto: CrearCheckInDto) {
    const usuario = await this.usuariosService.obtenerDocumentoPorId(usuarioId);
    const desafio = await this.desafiosService.obtenerDocumentoPorId(desafioId);
    const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);

    if (estado !== EstadoDesafio.ACTIVO) {
      throw new ConflictException(
        'Solo podés registrar check-ins en desafíos activos',
      );
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

    const hoy = obtenerFechaCalendarioHoy(usuario.zonaHoraria);
    const ayer = obtenerFechaCalendarioAyer(usuario.zonaHoraria);

    if (dto.dia !== hoy && dto.dia !== ayer) {
      throw new BadRequestException(
        'Solo podés registrar el check-in de hoy o de ayer',
      );
    }

    if (dto.dia < desafio.fechaInicio || dto.dia > desafio.fechaFin) {
      throw new BadRequestException(
        'El día del check-in debe estar dentro del rango del desafío',
      );
    }

    try {
      const checkIn = await this.checkInModel.create({
        desafioId: desafio._id,
        usuarioId: new Types.ObjectId(usuarioId),
        dia: dto.dia,
        nota: dto.nota?.trim(),
        valor: dto.valor,
        zonaHorariaUsada: usuario.zonaHoraria,
      });
      return serializarDocumento(checkIn);
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

    await ultimo.deleteOne();
    return { mensaje: 'Check-in deshecho correctamente' };
  }

  async listarPorDesafioYUsuario(
    desafioId: string,
    usuarioIdConsulta: string,
  ) {
    await this.desafiosService.obtenerDocumentoPorId(desafioId);
    await this.usuariosService.obtenerPorId(usuarioIdConsulta);

    const checkIns = await this.checkInModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        usuarioId: new Types.ObjectId(usuarioIdConsulta),
      })
      .sort({ dia: -1, creadoEn: -1 });

    return checkIns.map((checkIn) => serializarDocumento(checkIn));
  }
}
