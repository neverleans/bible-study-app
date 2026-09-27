import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../database/database.module';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return this.getStatus(key, true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { message }),
      );
    }
  }
}
