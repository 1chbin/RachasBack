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
import {
  Participacion,
  ParticipacionDocument,
} from './schemas/participacion.schema';
import { DesafiosService } from '../desafios/desafios.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { EstadoDesafio } from '../common/enums/estado-desafio.enum';
import { EstadoDesafioService } from '../common/services/estado-desafio.service';
import { serializarDocumento } from '../common/utils/serializar.util';

@Injectable()
export class ParticipacionesService {
  constructor(
    @InjectModel(Participacion.name)
    private readonly participacionModel: Model<ParticipacionDocument>,
    @Inject(forwardRef(() => DesafiosService))
    private readonly desafiosService: DesafiosService,
    private readonly usuariosService: UsuariosService,
    private readonly estadoDesafioService: EstadoDesafioService,
  ) {}

  async registrarCreador(desafioId: Types.ObjectId, usuarioId: string) {
    await this.participacionModel.create({
      desafioId,
      usuarioId: new Types.ObjectId(usuarioId),
    });
  }

  async unirse(codigoInvitacion: string, usuarioId: string) {
    await this.usuariosService.obtenerDocumentoPorId(usuarioId);

    const desafio =
      await this.desafiosService.obtenerDocumentoPorCodigo(codigoInvitacion);
    const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);

    if (
      estado !== EstadoDesafio.PROGRAMADO &&
      estado !== EstadoDesafio.ACTIVO
    ) {
      throw new ConflictException(
        'Solo podés unirte a desafíos programados o activos',
      );
    }

    const participacionExistente = await this.participacionModel.findOne({
      desafioId: desafio._id,
      usuarioId: new Types.ObjectId(usuarioId),
    });

    if (participacionExistente) {
      if (!participacionExistente.abandonadoEn) {
        throw new ConflictException('Ya participás en este desafío');
      }
      throw new ConflictException(
        'No podés volver a unirte a un desafío que abandonaste',
      );
    }

    const vigentes = await this.contarDesafiosVigentes(usuarioId);
    if (vigentes >= 5) {
      throw new ConflictException(
        'No podés tener más de 5 desafíos vigentes a la vez',
      );
    }

    const participantesActivos = await this.contarParticipantesActivos(
      desafio._id.toString(),
    );
    if (participantesActivos >= desafio.maxParticipantes) {
      throw new ConflictException('El desafío ya no tiene cupo disponible');
    }

    const participacion = await this.participacionModel.create({
      desafioId: desafio._id,
      usuarioId: new Types.ObjectId(usuarioId),
    });

    return {
      participacion: serializarDocumento(participacion),
      desafio: await this.desafiosService.obtenerPorId(
        desafio._id.toString(),
        usuarioId,
      ),
    };
  }

  async abandonar(desafioId: string, usuarioId: string) {
    const desafio = await this.desafiosService.obtenerDocumentoPorId(desafioId);
    const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);

    if (!this.estadoDesafioService.esVigente(estado)) {
      throw new ConflictException(
        'No podés abandonar un desafío finalizado o cancelado',
      );
    }

    if (desafio.creadorId.toString() === usuarioId) {
      throw new BadRequestException(
        'El creador no puede abandonar el desafío; debe cancelarlo',
      );
    }

    const participacion = await this.participacionModel.findOne({
      desafioId: desafio._id,
      usuarioId: new Types.ObjectId(usuarioId),
    });

    if (!participacion || participacion.abandonadoEn) {
      throw new NotFoundException('No participás activamente en este desafío');
    }

    participacion.abandonadoEn = new Date();
    await participacion.save();

    return { mensaje: 'Abandonaste el desafío correctamente' };
  }

  async assertParticipacionActiva(desafioId: string, usuarioId: string) {
    const participacion = await this.obtenerParticipacionActiva(
      desafioId,
      usuarioId,
    );
    if (!participacion) {
      throw new ForbiddenException(
        'Solo los participantes del desafío pueden acceder a este recurso',
      );
    }
  }

  async listarParticipantesActivosInterno(desafioId: string) {
    const participaciones = await this.participacionModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        abandonadoEn: { $exists: false },
      })
      .populate('usuarioId', 'nombre alias email zonaHoraria')
      .sort({ seUnioEn: 1 });

    return participaciones.map((participacion) => {
      const usuario = participacion.usuarioId as unknown as {
        _id: Types.ObjectId;
      };
      return { usuarioId: usuario._id.toString() };
    });
  }

  async listarParticipantesActivos(desafioId: string, usuarioId: string) {
    await this.desafiosService.obtenerDocumentoPorId(desafioId);
    await this.assertParticipacionActiva(desafioId, usuarioId);

    const participaciones = await this.participacionModel
      .find({
        desafioId: new Types.ObjectId(desafioId),
        abandonadoEn: { $exists: false },
      })
      .populate('usuarioId', 'nombre alias email zonaHoraria')
      .sort({ seUnioEn: 1 });

    return participaciones.map((participacion) => {
      const usuario = participacion.usuarioId as unknown as {
        _id: Types.ObjectId;
        nombre: string;
        alias: string;
        email: string;
        zonaHoraria: string;
      };

      return {
        id: participacion._id.toString(),
        seUnioEn: participacion.seUnioEn,
        usuario: {
          id: usuario._id.toString(),
          nombre: usuario.nombre,
          alias: usuario.alias,
          email: usuario.email,
          zonaHoraria: usuario.zonaHoraria,
        },
      };
    });
  }

  async contarParticipantesActivos(desafioId: string): Promise<number> {
    return this.participacionModel.countDocuments({
      desafioId: new Types.ObjectId(desafioId),
      abandonadoEn: { $exists: false },
    });
  }

  async obtenerParticipacionActiva(desafioId: string, usuarioId: string) {
    return this.participacionModel.findOne({
      desafioId: new Types.ObjectId(desafioId),
      usuarioId: new Types.ObjectId(usuarioId),
      abandonadoEn: { $exists: false },
    });
  }

  async listarDesafioIdsPorUsuario(usuarioId: string): Promise<string[]> {
    const participaciones = await this.participacionModel.find({
      usuarioId: new Types.ObjectId(usuarioId),
      abandonadoEn: { $exists: false },
    });
    return participaciones.map((p) => p.desafioId.toString());
  }

  private async contarDesafiosVigentes(usuarioId: string): Promise<number> {
    const participaciones = await this.participacionModel.find({
      usuarioId: new Types.ObjectId(usuarioId),
      abandonadoEn: { $exists: false },
    });

    let vigentes = 0;
    for (const participacion of participaciones) {
      const desafio = await this.desafiosService.obtenerDocumentoPorId(
        participacion.desafioId.toString(),
      );
      const estado = this.desafiosService.obtenerEstadoDeDocumento(desafio);
      if (this.estadoDesafioService.esVigente(estado)) {
        vigentes += 1;
      }
    }
    return vigentes;
  }
}
