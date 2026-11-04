import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthIndicator {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      if (this.connection.readyState !== 1) {
        return indicator.down({ message: 'MongoDB desconectado' });
      }
      await this.connection.db?.admin().ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Error de MongoDB',
      });
    }
  }
}
