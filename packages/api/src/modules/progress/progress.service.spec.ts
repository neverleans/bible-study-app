import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { DRIZZLE } from '../../database/database.module';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };
  const mockDb = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
  };

  const bookLookup = (rows: unknown[]) =>
    mockTx.select.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(rows),
    });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(ProgressService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('marks a chapter as read', async () => {
    const now = new Date();
    bookLookup([{ id: 1, abbrev: 'jn', name: 'João', chapterCount: 21 }]);
    mockTx.insert
      .mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        onConflictDoNothing: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ chapterNumber: 3, completedAt: now }]),
      });

    const result = await service.markRead('user-1', { bookAbbrev: 'jn', chapterNumber: 3 });

    expect(result).toEqual({
      bookAbbrev: 'jn',
      chapterNumber: 3,
      completedAt: now.toISOString(),
    });
  });

  it('rejects a chapter number beyond the book length', async () => {
    bookLookup([{ id: 1, abbrev: 'jn', name: 'João', chapterCount: 21 }]);
    mockTx.insert.mockReturnValue({
      values: jest.fn().mockReturnThis(),
      onConflictDoNothing: jest.fn().mockResolvedValue([]),
    });

    await expect(
      service.markRead('user-1', { bookAbbrev: 'jn', chapterNumber: 22 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when unmarking a chapter that was not read', async () => {
    bookLookup([{ id: 1, abbrev: 'jn', name: 'João', chapterCount: 21 }]);
    mockTx.delete.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    });

    await expect(service.unmarkRead('user-1', 'jn', 2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('unmarks a read chapter', async () => {
    bookLookup([{ id: 1, abbrev: 'jn', name: 'João', chapterCount: 21 }]);
    mockTx.delete.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'p1' }]),
    });

    await expect(service.unmarkRead('user-1', 'jn', 2)).resolves.toEqual({ success: true });
  });
});
