import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { MongoHealthIndicator } from './mongo.health';

@Module({
  imports: [TerminusModule, MongooseModule],
  controllers: [HealthController],
  providers: [MongoHealthIndicator],
})
export class HealthModule {}
