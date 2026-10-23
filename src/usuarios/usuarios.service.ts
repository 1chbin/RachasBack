import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { serializarDocumento } from '../common/utils/serializar.util';
import { esAliasProvisional } from '../common/utils/alias-provisional.util';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async obtenerPerfilAutenticado(id: string) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const base = serializarDocumento(usuario);
    return {
      ...base,
      requiereAlias: esAliasProvisional(usuario.alias),
    };
  }

  async obtenerDocumentoPorId(id: string): Promise<UsuarioDocument> {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.nombre !== undefined) {
      usuario.nombre = dto.nombre.trim();
    }
    if (dto.zonaHoraria !== undefined) {
      usuario.zonaHoraria = dto.zonaHoraria;
    }

    await usuario.save();
    const base = serializarDocumento(usuario);
    return {
      ...base,
      requiereAlias: esAliasProvisional(usuario.alias),
    };
  }

  async existePorId(id: string): Promise<boolean> {
    const count = await this.usuarioModel.countDocuments({ _id: id });
    return count > 0;
  }
}
