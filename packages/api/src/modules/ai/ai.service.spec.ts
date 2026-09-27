import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { DRIZZLE } from '../../database/database.module';

describe('AiService', () => {
  let service: AiService;
  let mockDb: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
    };

    mockQueue = {
      getJob: jest.fn(),
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
        {
          provide: getQueueToken('ai-analysis'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestChapterAnalysis', () => {
    it('should return cached analysis if already in ai_cache', async () => {
      const mockCachedData = {
        title: 'Criação',
        summary: 'No princípio...',
      };

      // Mock findBookByAbbrev
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([{ id: 1, name: 'Gênesis', abbrev: 'gn' }]),
            }),
          }),
        })
        // Mock getCachedAnalysis
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([
                {
                  response: JSON.stringify(mockCachedData),
                },
              ]),
            }),
          }),
        });

      const result = await service.requestChapterAnalysis('gn', 1);

      expect(result.status).toBe('completed');
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(mockCachedData);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should queue a BullMQ job when analysis is not cached', async () => {
      // Mock findBookByAbbrev
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([{ id: 1, name: 'Gênesis', abbrev: 'gn' }]),
            }),
          }),
        })
        // Mock getCachedAnalysis (miss)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([]),
            }),
          }),
        })
        // Mock chapter lookup
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([
                { verses: ['No princípio criou Deus os céus e a terra.'] },
              ]),
            }),
          }),
        });

      mockQueue.getJob.mockResolvedValueOnce(null);
      mockQueue.add.mockResolvedValueOnce({ id: 'chapter-1-1' });

      const result = await service.requestChapterAnalysis('gn', 1);

      expect(result.status).toBe('queued');
      expect(result.cached).toBe(false);
      expect(result.jobId).toBe('chapter-1-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'chapter-analysis',
        expect.objectContaining({
          bookId: 1,
          chapterNumber: 1,
        }),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if book does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      await expect(service.requestChapterAnalysis('inexistente', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return completed if state is completed in queue', async () => {
      // Mock DB check (cache miss)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const mockData = { title: 'Concluído' };
      mockQueue.getJob.mockResolvedValueOnce({
        getState: jest.fn().mockResolvedValueOnce('completed'),
        returnvalue: mockData,
      });

      const result = await service.getJobStatus('chapter-1-1');

      expect(result.status).toBe('completed');
      expect(result.data).toEqual(mockData);
    });

    it('should return active status when job is running', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      mockQueue.getJob.mockResolvedValueOnce({
        getState: jest.fn().mockResolvedValueOnce('active'),
      });

      const result = await service.getJobStatus('chapter-1-1');

      expect(result.status).toBe('active');
    });

    it('should return failed if job failed in queue', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      mockQueue.getJob.mockResolvedValueOnce({
        getState: jest.fn().mockResolvedValueOnce('failed'),
        failedReason: 'Erro na API',
      });

      const result = await service.getJobStatus('chapter-1-1');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Erro na API');
    });
  });
});
