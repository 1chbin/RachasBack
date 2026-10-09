import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CheckInDocument = HydratedDocument<CheckIn>;

@Schema({
  collection: 'checkins',
  timestamps: { createdAt: 'creadoEn', updatedAt: false },
})
export class CheckIn {
  @Prop({ type: Types.ObjectId, ref: 'Desafio', required: true })
  desafioId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId: Types.ObjectId;

  @Prop({ required: true })
  dia: string;

  @Prop({ trim: true, maxlength: 140 })
  nota?: string;

  @Prop()
  valor?: number;

  @Prop({ required: true })
  zonaHorariaUsada: string;
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
CheckInSchema.index({ desafioId: 1, usuarioId: 1, dia: 1 }, { unique: true });
