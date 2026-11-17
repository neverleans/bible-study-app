import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { DRIZZLE } from '../../database/database.module';

describe('CompletionService', () => {
  let service: CompletionService;
  const mockTx = { execute: jest.fn().mockResolvedValue([]), select: jest.fn() };
  const mockDb = { transaction: jest.fn().mockImplementation((cb) => cb(mockTx)) };

  const bookQuery = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  });
  const bestQuery = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(rows),
  });
  const aggQuery = (row: unknown) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([row]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompletionService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(CompletionService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('averages the best score per chapter and counts reflections and cards', async () => {
    mockTx.select
      .mockReturnValueOnce(bookQuery([{ id: 7, abbrev: 'jn', name: 'Jonas', chapterCount: 4 }]))
      .mockReturnValueOnce(
        bestQuery([
          { chapterNumber: 1, bestScore: 5, total: 5 },
          { chapterNumber: 2, bestScore: 3, total: 5 },
        ]),
      )
      .mockReturnValueOnce(aggQuery({ total: 3, chapters: 2 }))
      .mockReturnValueOnce(aggQuery({ total: 4 }));

    const stats = await service.getBookStats('u1', 'JN');

    expect(mockTx.execute).toHaveBeenCalledTimes(1); // RLS user context
    expect(stats).toEqual({
      bookAbbrev: 'jn',
      bookName: 'Jonas',
      chapterCount: 4,
      quizBestByChapter: [
        { chapterNumber: 1, bestScore: 5, total: 5 },
        { chapterNumber: 2, bestScore: 3, total: 5 },
      ],
      quizAveragePercent: 80, // (100% + 60%) / 2
      reflectionCount: 3,
      reflectionChapters: 2,
      reviewCardCount: 4,
    });
  });

  it('reports a zero average when there are no attempts', async () => {
    mockTx.select
      .mockReturnValueOnce(bookQuery([{ id: 7, abbrev: 'jn', name: 'Jonas', chapterCount: 4 }]))
      .mockReturnValueOnce(bestQuery([]))
      .mockReturnValueOnce(aggQuery({ total: 0, chapters: 0 }))
      .mockReturnValueOnce(aggQuery({ total: 0 }));

    await expect(service.getBookStats('u1', 'jn')).resolves.toMatchObject({
      quizBestByChapter: [],
      quizAveragePercent: 0,
      reflectionCount: 0,
    });
  });

  it('throws NotFound for an unknown book', async () => {
    mockTx.select.mockReturnValueOnce(bookQuery([]));
    await expect(service.getBookStats('u1', 'zz')).rejects.toBeInstanceOf(NotFoundException);
  });
});
