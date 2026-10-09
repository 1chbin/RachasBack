import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ZONA_HORARIA_DEFAULT } from '../../common/constants/zona-horaria-default';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({ collection: 'usuarios', timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  alias: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, default: ZONA_HORARIA_DEFAULT })
  zonaHoraria: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
