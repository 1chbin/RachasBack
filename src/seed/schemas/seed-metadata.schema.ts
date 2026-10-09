import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SeedMetadataDocument = HydratedDocument<SeedMetadata>;

@Schema({ collection: 'seed_metadata' })
export class SeedMetadata {
  @Prop({ required: true, unique: true })
  clave: string;
}

export const SeedMetadataSchema = SchemaFactory.createForClass(SeedMetadata);
