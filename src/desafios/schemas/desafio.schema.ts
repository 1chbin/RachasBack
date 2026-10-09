import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CategoriaDesafio } from '../../common/enums/categoria-desafio.enum';

export type DesafioDocument = HydratedDocument<Desafio>;

@Schema({ collection: 'desafios', timestamps: true })
export class Desafio {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ trim: true, maxlength: 280 })
  descripcion?: string;

  @Prop({ required: true, enum: CategoriaDesafio })
  categoria: CategoriaDesafio;

  @Prop({ required: true })
  fechaInicio: string;

  @Prop({ required: true })
  fechaFin: string;

  @Prop({ required: true, default: 10, min: 2, max: 20 })
  maxParticipantes: number;

  @Prop({ required: true, unique: true, uppercase: true })
  codigoInvitacion: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  creadorId: Types.ObjectId;

  @Prop({ required: true, default: false })
  cancelado: boolean;
}

export const DesafioSchema = SchemaFactory.createForClass(Desafio);
