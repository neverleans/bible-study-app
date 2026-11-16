import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { DRIZZLE } from '../../database/database.module';

const NOW = new Date('2026-11-16T12:00:00.000Z');

describe('ReviewService', () => {
  let service: ReviewService;
  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockDb = { transaction: jest.fn().mockImplementation((cb) => cb(mockTx)) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(ReviewService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('reschedules a card with SM-2 after a good answer', async () => {
    const card = {
      id: 'c1', bookId: 1, chapterNumber: 1, verseNumber: 3, kind: 'verse', sourceKey: 'verse:1:3',
      prompt: 'Recite', answer: 'texto', ease: 2.5, intervalDays: 0, repetitions: 0,
      dueAt: NOW, lastReviewedAt: null, createdAt: NOW, userId: 'u1',
    };
    mockTx.select.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ card, bookAbbrev: 'jn', bookName: 'Jonas' }]),
    });
    const set = jest.fn().mockReturnThis();
    mockTx.update.mockReturnValue({
      set,
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ ...card, intervalDays: 1, repetitions: 1, dueAt: new Date('2026-11-17T12:00:00.000Z') }]),
    });

    const result = await service.grade('u1', 'c1', 'good', NOW);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ intervalDays: 1, repetitions: 1, ease: 2.5, lastReviewedAt: NOW }),
    );
    expect(result).toMatchObject({ id: 'c1', bookAbbrev: 'jn', intervalDays: 1, dueAt: '2026-11-17T12:00:00.000Z' });
  });

  it('throws NotFound when grading a card that is missing or belongs to someone else (RLS)', async () => {
    mockTx.select.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    await expect(service.grade('u1', 'nope', 'good', NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a verse card for a verse that does not exist', async () => {
    mockTx.select
      .mockReturnValueOnce({ from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([{ id: 1, abbrev: 'jn', name: 'Jonas' }]) })
      .mockReturnValueOnce({ from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([{ verses: ['v1'] }]) });
    await expect(service.createVerseCard('u1', 'jn', 1, 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when removing a missing card', async () => {
    mockTx.delete.mockReturnValue({ where: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([]) });
    await expect(service.remove('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
