import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { serializarDocumento } from '../common/utils/serializar.util';
import { lanzarSiDuplicado } from '../common/utils/errores-mongo.util';
import { ZONA_HORARIA_DEFAULT } from '../common/constants/zona-horaria-default';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async listarTodos() {
    const usuarios = await this.usuarioModel.find().sort({ createdAt: -1 });
    return usuarios.map((usuario) => serializarDocumento(usuario));
  }

  async crear(dto: CrearUsuarioDto) {
    try {
      const usuario = await this.usuarioModel.create({
        nombre: dto.nombre.trim(),
        alias: dto.alias.trim().toLowerCase(),
        email: dto.email.trim().toLowerCase(),
        zonaHoraria: dto.zonaHoraria ?? ZONA_HORARIA_DEFAULT,
      });
      return serializarDocumento(usuario);
    } catch (error) {
      lanzarSiDuplicado(error, 'El alias o el email ya están registrados');
      throw error;
    }
  }

  async obtenerPorId(id: string) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return serializarDocumento(usuario);
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
    return serializarDocumento(usuario);
  }

  async existePorId(id: string): Promise<boolean> {
    const count = await this.usuarioModel.countDocuments({ _id: id });
    return count > 0;
  }
}
