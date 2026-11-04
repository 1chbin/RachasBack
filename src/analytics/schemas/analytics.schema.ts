import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventoUsoDocument = HydratedDocument<EventoUso>;

@Schema({ collection: 'eventos_uso', timestamps: { createdAt: 'creadoEn', updatedAt: false } })
export class EventoUso {
  @Prop({ required: true, index: true })
  nombre: string;

  @Prop({ type: Object, default: {} })
  propiedades: Record<string, string | number | boolean>;

  @Prop()
  usuarioId?: string;

  @Prop()
  appVersion?: string;

  @Prop()
  platform?: string;

  @Prop({ required: true, index: true })
  ocurrioEn: Date;
}

export const EventoUsoSchema = SchemaFactory.createForClass(EventoUso);
EventoUsoSchema.index({ ocurrioEn: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

@Schema({ collection: 'client_errors', timestamps: { createdAt: 'creadoEn', updatedAt: false } })
export class ClientError {
  @Prop({ required: true })
  mensaje: string;

  @Prop()
  pantalla?: string;

  @Prop()
  appVersion?: string;

  @Prop()
  platform?: string;

  @Prop()
  requestId?: string;
}

export type ClientErrorDocument = HydratedDocument<ClientError>;
export const ClientErrorSchema = SchemaFactory.createForClass(ClientError);
ClientErrorSchema.index({ creadoEn: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
