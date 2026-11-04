import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { MongoHealthIndicator } from './mongo.health';

@Public()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoHealth: MongoHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.mongoHealth.isHealthy('mongodb')]);
  }
}
