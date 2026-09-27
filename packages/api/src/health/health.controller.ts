import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const diskPath = process.platform === 'win32' ? 'C:\\' : '/';
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.memory.checkHeap('memory_heap', 600 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: diskPath, thresholdPercent: 0.95 }),
    ]);
  }
}
