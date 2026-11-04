import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClientError,
  ClientErrorSchema,
  EventoUso,
  EventoUsoSchema,
} from './schemas/analytics.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventoUso.name, schema: EventoUsoSchema },
      { name: ClientError.name, schema: ClientErrorSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
