import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

@Injectable()
export class MongoHealthIndicator {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    if (this.connection.readyState !== ConnectionStates.connected) {
      return indicator.down({ message: 'MongoDB desconectado' });
    }
    return indicator.up();
  }
}
