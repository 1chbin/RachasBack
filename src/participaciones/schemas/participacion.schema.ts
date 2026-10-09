import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ParticipacionDocument = HydratedDocument<Participacion>;

@Schema({ collection: 'participaciones', timestamps: true })
export class Participacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Desafio', required: true })
  desafioId: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  seUnioEn: Date;

  @Prop()
  abandonadoEn?: Date;
}

export const ParticipacionSchema = SchemaFactory.createForClass(Participacion);
ParticipacionSchema.index({ usuarioId: 1, desafioId: 1 }, { unique: true });
