import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { DRIZZLE } from '../../database/database.module';

const questions = [
  { question: 'P1?', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'Porque b.', verse: 1 },
  { question: 'P2?', options: ['a', 'b', 'c', 'd'], correctIndex: 3, explanation: 'Porque d.', verse: 2 },
];

describe('QuizService', () => {
  let service: QuizService;

  const mockTx = { execute: jest.fn().mockResolvedValue([]), insert: jest.fn() };
  const mockDb = {
    select: jest.fn(),
    transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
  };
  const mockQueue = { getJob: jest.fn(), add: jest.fn() };

  const limited = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: getQueueToken('ai-analysis'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get(QuizService);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
  });

  it('never exposes the answer key or explanations before grading', async () => {
    mockDb.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([{ id: 'q1', questions }]));

    const result = await service.getChapterQuiz('jn', 1);

    expect(result.status).toBe('ready');
    expect(JSON.stringify(result)).not.toMatch(/correctIndex|explanation|Porque/);
    expect(result.questions?.[0]).toEqual({ question: 'P1?', options: ['a', 'b', 'c', 'd'], verse: 1 });
  });

  it('reports none when there is no quiz and no job', async () => {
    mockDb.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([]));
    mockQueue.getJob.mockResolvedValue(null);
    await expect(service.getChapterQuiz('jn', 1)).resolves.toEqual({ status: 'none' });
  });

  it('reports the failure reason of a failed job', async () => {
    mockDb.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([]));
    mockQueue.getJob.mockResolvedValue({ getState: async () => 'failed', failedReason: 'sem chave' });
    await expect(service.getChapterQuiz('jn', 1)).resolves.toEqual({ status: 'failed', error: 'sem chave' });
  });

  it('enqueues generation once and does not duplicate an in-flight job', async () => {
    mockDb.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([]))
      .mockReturnValueOnce(limited([{ verses: ['v1', 'v2'] }]));
    mockQueue.getJob.mockResolvedValue(null);

    await expect(service.requestGeneration('jn', 1)).resolves.toEqual({ status: 'generating' });
    expect(mockQueue.add).toHaveBeenCalledWith(
      'chapter-quiz',
      expect.objectContaining({ bookId: 7, verseCount: 2, versesText: '1. v1\n2. v2' }),
      expect.objectContaining({ jobId: 'quiz-7-1' }),
    );

    mockDb.select
      .mockReturnValueOnce(limited([{ id: 7, abbrev: 'jn', name: 'Jonas' }]))
      .mockReturnValueOnce(limited([]))
      .mockReturnValueOnce(limited([{ verses: ['v1', 'v2'] }]));
    mockQueue.getJob.mockResolvedValue({ getState: async () => 'active' });
    mockQueue.add.mockClear();
    await service.requestGeneration('jn', 1);
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('grades on the server and stores the attempt', async () => {
    mockDb.select.mockReturnValueOnce(limited([{ id: 'q1', questions }]));
    mockTx.insert
      .mockReturnValueOnce({ values: jest.fn().mockReturnThis(), onConflictDoNothing: jest.fn().mockResolvedValue([]) })
      .mockReturnValueOnce({ values: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([{ id: 'a1' }]) });

    const result = await service.submitAttempt('user-1', 'q1', [1, 0]);

    expect(result.score).toBe(1);
    expect(result.total).toBe(2);
    expect(result.results[0]).toMatchObject({ correct: true, correctIndex: 1 });
    expect(result.results[1]).toMatchObject({ correct: false, correctIndex: 3, explanation: 'Porque d.' });
    expect(result.attemptId).toBe('a1');
  });

  it('rejects an attempt that does not answer every question', async () => {
    mockDb.select.mockReturnValueOnce(limited([{ id: 'q1', questions }]));
    await expect(service.submitAttempt('user-1', 'q1', [1])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an attempt on a quiz that does not exist', async () => {
    mockDb.select.mockReturnValueOnce(limited([]));
    await expect(service.submitAttempt('user-1', 'nope', [1, 1])).rejects.toBeInstanceOf(NotFoundException);
  });
});
