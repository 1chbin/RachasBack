import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema';
import { ProveedorAuth } from '../common/enums/proveedor-auth.enum';
import { ZONA_HORARIA_DEFAULT } from '../common/constants/zona-horaria-default';
import {
  esAliasProvisional,
  generarAliasProvisional,
} from '../common/utils/alias-provisional.util';
import { serializarDocumento } from '../common/utils/serializar.util';
import { lanzarSiDuplicado } from '../common/utils/errores-mongo.util';
import { ActualizarAliasDto } from '../usuarios/dto/actualizar-alias.dto';

export type UsuarioSerializado = ReturnType<typeof serializarDocumento> & {
  id: string;
  requiereAlias: boolean;
};

function esProveedorGoogle(decoded: DecodedIdToken): boolean {
  return decoded.firebase?.sign_in_provider === 'google.com';
}

@Injectable()
export class AuthUsuarioService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  presentarUsuario(usuario: UsuarioDocument): UsuarioSerializado {
    const base = serializarDocumento(usuario) as UsuarioSerializado;
    return {
      ...base,
      requiereAlias: esAliasProvisional(usuario.alias),
    };
  }

  private async vincularFirebaseUid(
    usuario: UsuarioDocument,
    firebaseUid: string,
  ): Promise<UsuarioSerializado> {
    usuario.firebaseUid = firebaseUid;
    await usuario.save();
    return this.presentarUsuario(usuario);
  }

  async findOrCreateFromToken(
    decoded: DecodedIdToken,
  ): Promise<UsuarioSerializado> {
    const firebaseUid = decoded.uid;
    const existente = await this.usuarioModel.findOne({ firebaseUid });
    if (existente) {
      return this.presentarUsuario(existente);
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException(
        'La cuenta no incluye un email válido',
      );
    }

    if (esProveedorGoogle(decoded)) {
      const porEmail = await this.usuarioModel.findOne({ email });
      if (!porEmail) {
        throw new ForbiddenException(
          'Registrate primero con email y contraseña antes de usar Google',
        );
      }
      return this.vincularFirebaseUid(porEmail, firebaseUid);
    }

    const nombre =
      decoded.name?.trim() ||
      email.split('@')[0] ||
      'Usuario';

    try {
      const usuario = await this.usuarioModel.create({
        nombre,
        alias: generarAliasProvisional(firebaseUid),
        email,
        zonaHoraria: ZONA_HORARIA_DEFAULT,
        firebaseUid,
        proveedorAuth: ProveedorAuth.EMAIL,
      });
      return this.presentarUsuario(usuario);
    } catch (error) {
      lanzarSiDuplicado(
        error,
        'Ya existe una persona con ese email u otro conflicto de registro',
      );
      const porEmail = await this.usuarioModel.findOne({ email });
      if (porEmail) {
        return this.vincularFirebaseUid(porEmail, firebaseUid);
      }
      throw error;
    }
  }

  async obtenerPorFirebaseUid(firebaseUid: string): Promise<UsuarioDocument> {
    const usuario = await this.usuarioModel.findOne({ firebaseUid });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async actualizarAlias(
    usuarioId: string,
    dto: ActualizarAliasDto,
  ): Promise<UsuarioSerializado> {
    const usuario = await this.usuarioModel.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!esAliasProvisional(usuario.alias)) {
      throw new BadRequestException('El alias ya fue definido');
    }

    try {
      usuario.alias = dto.alias.trim().toLowerCase();
      await usuario.save();
      return this.presentarUsuario(usuario);
    } catch (error) {
      lanzarSiDuplicado(error, 'El alias ya está en uso');
      throw error;
    }
  }
}
