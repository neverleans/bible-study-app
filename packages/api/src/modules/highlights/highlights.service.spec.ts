import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { DRIZZLE } from '../../database/database.module';

describe('HighlightsService', () => {
  let service: HighlightsService;

  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };
  const mockDb = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HighlightsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(HighlightsService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('sets the RLS user context and lists highlights', async () => {
    const now = new Date();
    mockTx.select.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([
        {
          id: 'h1',
          bookAbbrev: 'jn',
          chapterNumber: 1,
          verseNumber: 3,
          color: 'promise',
          createdAt: now,
          updatedAt: now,
        },
      ]),
    });

    const result = await service.getHighlights('user-1', 'jn', 1);

    expect(mockTx.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 'h1',
        bookAbbrev: 'jn',
        chapterNumber: 1,
        verseNumber: 3,
        color: 'promise',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ]);
  });

  it('upserts a highlight with onConflictDoUpdate so a verse keeps one color', async () => {
    const now = new Date();
    mockTx.select.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ id: 7, abbrev: 'jn', name: 'João' }]),
    });
    const userInsert = {
      values: jest.fn().mockReturnThis(),
      onConflictDoNothing: jest.fn().mockResolvedValue([]),
    };
    const onConflictDoUpdate = jest.fn().mockReturnThis();
    const highlightInsert = {
      values: jest.fn().mockReturnThis(),
      onConflictDoUpdate,
      returning: jest.fn().mockResolvedValue([
        { id: 'h1', chapterNumber: 1, verseNumber: 3, color: 'place', createdAt: now, updatedAt: now },
      ]),
    };
    mockTx.insert.mockReturnValueOnce(userInsert).mockReturnValueOnce(highlightInsert);

    const result = await service.upsertHighlight('user-1', {
      bookAbbrev: 'JN',
      chapterNumber: 1,
      verseNumber: 3,
      color: 'place',
    });

    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(result.color).toBe('place');
    expect(result.bookAbbrev).toBe('jn');
  });

  it('throws NotFound when the book does not exist', async () => {
    mockTx.select.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockTx.insert.mockReturnValue({
      values: jest.fn().mockReturnThis(),
      onConflictDoNothing: jest.fn().mockResolvedValue([]),
    });

    await expect(
      service.upsertHighlight('user-1', {
        bookAbbrev: 'zz',
        chapterNumber: 1,
        verseNumber: 1,
        color: 'person',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when deleting a highlight RLS hides or that is missing', async () => {
    mockTx.delete.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    });

    await expect(service.deleteHighlight('user-1', 'nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
