import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PuntosCheckIn {
  @Prop({ required: true, min: 10 })
  total: number;

  @Prop({ required: true, min: 0 })
  bonusPorRacha: number;
}

export const PuntosCheckInSchema = SchemaFactory.createForClass(PuntosCheckIn);
