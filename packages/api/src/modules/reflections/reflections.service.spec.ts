import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ReflectionsService } from './reflections.service';
import { DRIZZLE } from '../../database/database.module';

const NOW = new Date('2026-11-16T12:00:00.000Z');
const row = (over: Record<string, unknown> = {}) => ({
  id: 'r1', userId: 'u1', bookId: 7, chapterNumber: 1, content: 'texto da pessoa',
  feedbackStatus: 'pending', feedback: null, feedbackError: null, createdAt: NOW, ...over,
});

describe('ReflectionsService', () => {
  let service: ReflectionsService;
  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const mockDb = { transaction: jest.fn().mockImplementation((cb) => cb(mockTx)) };
  const mockQueue = { add: jest.fn() };

  const limited = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  });

  const arrange = () => {
    mockTx.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([{ verses: ['v1', 'v2', 'v3'] }]));
    mockTx.insert
      .mockReturnValueOnce({ values: jest.fn().mockReturnThis(), onConflictDoNothing: jest.fn().mockResolvedValue([]) })
      .mockReturnValueOnce({ values: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([row()]) });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReflectionsService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: getQueueToken('ai-analysis'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get(ReflectionsService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('saves the text and enqueues feedback with the chapter text as context', async () => {
    arrange();
    mockQueue.add.mockResolvedValue({});

    const result = await service.create('u1', { bookAbbrev: 'JN', chapterNumber: 1, content: '  texto da pessoa  ' });

    expect(result).toMatchObject({ id: 'r1', bookAbbrev: 'jn', feedbackStatus: 'pending', content: 'texto da pessoa' });
    expect(mockQueue.add).toHaveBeenCalledWith(
      'reflection-feedback',
      expect.objectContaining({
        reflectionId: 'r1', userId: 'u1', verseCount: 3, versesText: '1. v1\n2. v2\n3. v3', learnerText: 'texto da pessoa',
      }),
      expect.objectContaining({ jobId: 'reflection-r1', attempts: 3 }),
    );
  });

  it('keeps the saved text and marks feedback failed when the queue is unavailable', async () => {
    arrange();
    mockQueue.add.mockRejectedValue(new Error('redis down'));
    const set = jest.fn().mockReturnThis();
    mockTx.update.mockReturnValue({
      set,
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([row({ feedbackStatus: 'failed', feedbackError: 'Fila de IA indisponível.' })]),
    });

    const result = await service.create('u1', { bookAbbrev: 'jn', chapterNumber: 1, content: 'texto da pessoa' });

    expect(set).toHaveBeenCalledWith({ feedbackStatus: 'failed', feedbackError: 'Fila de IA indisponível.' });
    expect(result).toMatchObject({ feedbackStatus: 'failed', content: 'texto da pessoa' });
  });

  it('rejects an unknown book without saving anything', async () => {
    mockTx.select.mockReturnValueOnce(limited([]));
    await expect(
      service.create('u1', { bookAbbrev: 'zz', chapterNumber: 1, content: 'x'.repeat(50) }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('rejects a chapter that does not exist', async () => {
    mockTx.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([]));
    await expect(
      service.create('u1', { bookAbbrev: 'jn', chapterNumber: 99, content: 'x'.repeat(50) }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound for a reflection that is missing or belongs to someone else (RLS)', async () => {
    mockTx.select.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    await expect(service.get('u1', 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
