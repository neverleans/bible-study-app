import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthCheckService = {
    check: jest.fn().mockImplementation((indicators) => {
      const results = indicators.map((fn: () => unknown) => fn());
      return Promise.resolve({
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      });
    }),
  };

  const mockPrismaHealth = {
    isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
  };

  const mockMemory = {
    checkHeap: jest.fn().mockReturnValue({ memory_heap: { status: 'up' } }),
  };

  const mockDisk = {
    checkStorage: jest.fn().mockReturnValue({ storage: { status: 'up' } }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealth },
        { provide: MemoryHealthIndicator, useValue: mockMemory },
        { provide: DiskHealthIndicator, useValue: mockDisk },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(mockHealthCheckService.check).toHaveBeenCalled();
  });
});
