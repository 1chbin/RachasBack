import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Desafio, DesafioDocument } from './schemas/desafio.schema';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { ActualizarDesafioDto } from './dto/actualizar-desafio.dto';
import { ListarDesafiosQueryDto } from './dto/listar-desafios-query.dto';
import { CodigoInvitacionService } from '../common/services/codigo-invitacion.service';
import { EstadoDesafioService } from '../common/services/estado-desafio.service';
import { EstadoDesafio } from '../common/enums/estado-desafio.enum';
import {
  diasInclusive,
  esFechaCalendarioValida,
  obtenerFechaCalendarioHoy,
} from '../common/utils/fechas.util';
import { ZONA_HORARIA_DEFAULT } from '../common/constants/zona-horaria-default';
import { serializarDocumento } from '../common/utils/serializar.util';
import { lanzarSiDuplicado } from '../common/utils/errores-mongo.util';
import { paginarArray } from '../common/utils/paginacion.util';
import { ParticipacionesService } from '../participaciones/participaciones.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class DesafiosService {
  constructor(
    @InjectModel(Desafio.name)
    private readonly desafioModel: Model<DesafioDocument>,
    private readonly codigoInvitacionService: CodigoInvitacionService,
    private readonly estadoDesafioService: EstadoDesafioService,
    @Inject(forwardRef(() => ParticipacionesService))
    private readonly participacionesService: ParticipacionesService,
    private readonly usuariosService: UsuariosService,
  ) {}

  obtenerEstadoDeDocumento(desafio: DesafioDocument): EstadoDesafio {
    return this.estadoDesafioService.obtenerEstado({
      cancelado: desafio.cancelado,
      fechaInicio: desafio.fechaInicio,
      fechaFin: desafio.fechaFin,
    });
  }

  presentarResumenPublico(desafio: DesafioDocument) {
    const serializado = serializarDocumento(desafio) as Record<string, unknown>;
    const { codigoInvitacion, ...sinCodigo } = serializado;
    void codigoInvitacion;
    return {
      ...sinCodigo,
      estado: this.obtenerEstadoDeDocumento(desafio),
      creadorId: desafio.creadorId.toString(),
    };
  }

  presentarDetalleParticipante(desafio: DesafioDocument) {
    const serializado = serializarDocumento(desafio);
    return {
      ...serializado,
      estado: this.obtenerEstadoDeDocumento(desafio),
      creadorId: desafio.creadorId.toString(),
    };
  }

  private validarFechasDesafio(fechaInicio: string, fechaFin: string) {
    if (!esFechaCalendarioValida(fechaInicio) || !esFechaCalendarioValida(fechaFin)) {
      throw new BadRequestException('Las fechas deben ser válidas (YYYY-MM-DD)');
    }

    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }

    const duracion = diasInclusive(fechaInicio, fechaFin);
    if (duracion < 3 || duracion > 90) {
      throw new BadRequestException(
        'El desafío debe durar entre 3 y 90 días inclusive',
      );
    }

    const hoy = obtenerFechaCalendarioHoy(ZONA_HORARIA_DEFAULT);
    if (fechaInicio < hoy) {
      throw new BadRequestException(
        'La fecha de inicio no puede estar en el pasado',
      );
    }
  }

  async crear(dto: CrearDesafioDto, creadorId: string) {
    await this.usuariosService.obtenerDocumentoPorId(creadorId);
    this.validarFechasDesafio(dto.fechaInicio, dto.fechaFin);

    const vigentes = await this.contarDesafiosVigentesDeUsuario(creadorId);
    if (vigentes >= 5) {
      throw new ConflictException(
        'No podés tener más de 5 desafíos vigentes a la vez',
      );
    }

    let desafio: DesafioDocument | null = null;
    for (let intento = 0; intento < 5; intento += 1) {
      try {
        desafio = await this.desafioModel.create({
          nombre: dto.nombre.trim(),
          descripcion: dto.descripcion?.trim(),
          categoria: dto.categoria,
          fechaInicio: dto.fechaInicio,
          fechaFin: dto.fechaFin,
          maxParticipantes: dto.maxParticipantes ?? 10,
          codigoInvitacion: this.codigoInvitacionService.generar(),
          creadorId: new Types.ObjectId(creadorId),
        });
        break;
      } catch (error) {
        lanzarSiDuplicado(
          error,
          'No se pudo generar un código de invitación único',
        );
        if (intento === 4) {
          throw error;
        }
      }
    }

    if (!desafio) {
      throw new ConflictException('No se pudo crear el desafío');
    }

    await this.participacionesService.registrarCreador(desafio._id, creadorId);
    return this.presentarDetalleParticipante(desafio);
  }

  async listar(query: ListarDesafiosQueryDto) {
    const filtroMongo: Record<string, unknown> = {};
    if (query.categoria) {
      filtroMongo.categoria = query.categoria;
    }

    const desafios = await this.desafioModel.find(filtroMongo).sort({
      createdAt: -1,
    });

    const presentados = desafios.map((desafio) =>
      this.presentarResumenPublico(desafio),
    );

    const filtrados = query.estado
      ? presentados.filter((desafio) => desafio.estado === query.estado)
      : presentados;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return paginarArray(filtrados, page, limit);
  }

  async listarPorParticipante(usuarioId: string) {
    await this.usuariosService.obtenerPorId(usuarioId);
    const desafioIds =
      await this.participacionesService.listarDesafioIdsPorUsuario(usuarioId);

    if (desafioIds.length === 0) {
      return [];
    }

    const desafios = await this.desafioModel.find({
      _id: { $in: desafioIds.map((id) => new Types.ObjectId(id)) },
    });

    return desafios.map((desafio) =>
      this.presentarDetalleParticipante(desafio),
    );
  }

  async obtenerPorId(id: string, usuarioIdOpcional?: string) {
    const desafio = await this.obtenerDocumentoPorId(id);

    if (usuarioIdOpcional) {
      const participacion =
        await this.participacionesService.obtenerParticipacionActiva(
          id,
          usuarioIdOpcional,
        );
      if (participacion) {
        return this.presentarDetalleParticipante(desafio);
      }
    }

    return this.presentarResumenPublico(desafio);
  }

  async obtenerDocumentoPorId(id: string): Promise<DesafioDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Desafío no encontrado');
    }
    const desafio = await this.desafioModel.findById(id);
    if (!desafio) {
      throw new NotFoundException('Desafío no encontrado');
    }
    return desafio;
  }

  async obtenerDocumentoPorCodigo(codigo: string): Promise<DesafioDocument> {
    const desafio = await this.desafioModel.findOne({
      codigoInvitacion: codigo.toUpperCase(),
    });
    if (!desafio) {
      throw new NotFoundException('No existe un desafío con ese código');
    }
    return desafio;
  }

  async actualizar(id: string, dto: ActualizarDesafioDto, usuarioId: string) {
    const desafio = await this.obtenerDocumentoPorId(id);
    const estado = this.obtenerEstadoDeDocumento(desafio);

    if (desafio.creadorId.toString() !== usuarioId) {
      throw new ForbiddenException(
        'Solo el creador puede modificar el desafío',
      );
    }

    if (!this.estadoDesafioService.esOperable(estado)) {
      throw new ConflictException(
        'No se puede modificar un desafío finalizado o cancelado',
      );
    }

    if (dto.nombre !== undefined) {
      desafio.nombre = dto.nombre.trim();
    }
    if (dto.descripcion !== undefined) {
      desafio.descripcion = dto.descripcion.trim();
    }

    const fechaInicio = dto.fechaInicio ?? desafio.fechaInicio;
    const fechaFin = dto.fechaFin ?? desafio.fechaFin;

    if (dto.fechaInicio !== undefined || dto.fechaFin !== undefined) {
      if (estado !== EstadoDesafio.PROGRAMADO) {
        throw new ConflictException(
          'Las fechas solo se pueden modificar mientras el desafío está programado',
        );
      }
      this.validarFechasDesafio(fechaInicio, fechaFin);
      desafio.fechaInicio = fechaInicio;
      desafio.fechaFin = fechaFin;
    }

    if (dto.maxParticipantes !== undefined) {
      if (estado !== EstadoDesafio.PROGRAMADO) {
        throw new ConflictException(
          'El máximo de participantes solo se puede modificar mientras el desafío está programado',
        );
      }
      const activos = await this.participacionesService.contarParticipantesActivos(
        id,
      );
      if (dto.maxParticipantes < activos) {
        throw new BadRequestException(
          'El máximo no puede ser menor que la cantidad actual de participantes',
        );
      }
      desafio.maxParticipantes = dto.maxParticipantes;
    }

    await desafio.save();
    return this.presentarDetalleParticipante(desafio);
  }

  async cancelar(id: string, usuarioId: string) {
    const desafio = await this.obtenerDocumentoPorId(id);
    const estado = this.obtenerEstadoDeDocumento(desafio);

    if (desafio.creadorId.toString() !== usuarioId) {
      throw new ForbiddenException('Solo el creador puede cancelar el desafío');
    }

    if (
      estado !== EstadoDesafio.PROGRAMADO &&
      estado !== EstadoDesafio.ACTIVO
    ) {
      throw new ConflictException(
        'Solo se pueden cancelar desafíos programados o activos',
      );
    }

    desafio.cancelado = true;
    await desafio.save();
    return this.presentarDetalleParticipante(desafio);
  }

  private async contarDesafiosVigentesDeUsuario(usuarioId: string): Promise<number> {
    const desafioIds =
      await this.participacionesService.listarDesafioIdsPorUsuario(usuarioId);
    let vigentes = 0;
    for (const desafioId of desafioIds) {
      const desafio = await this.obtenerDocumentoPorId(desafioId);
      const estado = this.obtenerEstadoDeDocumento(desafio);
      if (this.estadoDesafioService.esVigente(estado)) {
        vigentes += 1;
      }
    }
    return vigentes;
  }
}
