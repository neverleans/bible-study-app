import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysisProcessor } from './ai-analysis.processor';
import { GeminiService } from '../services/gemini.service';
import { DRIZZLE } from '../../../database/database.module';

const feedback = {
  coveredPoints: ['Jonas fugiu para Társis'],
  missingPoints: ['A tempestade'],
  misunderstandings: [],
  encouragement: 'Bom começo, continue assim.',
};

const jobData = {
  reflectionId: 'r1', userId: 'u1', bookName: 'Jonas', chapterNumber: 1,
  versesText: '1. v1', verseCount: 1, learnerText: 'texto',
};

describe('AiAnalysisProcessor reflection-feedback job', () => {
  let processor: AiAnalysisProcessor;
  const set = jest.fn();
  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
  };
  const mockDb = { transaction: jest.fn().mockImplementation((cb) => cb(mockTx)) };
  const gemini = { generateReflectionFeedback: jest.fn() };

  const job = (attemptsMade: number, attempts = 3) =>
    ({ id: 'reflection-r1', name: 'reflection-feedback', data: jobData, attemptsMade, opts: { attempts } }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalysisProcessor,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: GeminiService, useValue: gemini },
      ],
    }).compile();
    processor = module.get(AiAnalysisProcessor);
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((cb) => cb(mockTx));
    set.mockReturnValue({ where: jest.fn().mockResolvedValue([]) });
    mockTx.update.mockReturnValue({ set });
  });

  it('stores the feedback as the owner (RLS context) and marks it done', async () => {
    gemini.generateReflectionFeedback.mockResolvedValue(feedback);

    await expect(processor.process(job(0))).resolves.toEqual({ reflectionId: 'r1' });

    expect(mockTx.execute).toHaveBeenCalledTimes(1); // set_config for the owner
    expect(set).toHaveBeenCalledWith({ feedback, feedbackStatus: 'done', feedbackError: null });
  });

  it('keeps it pending on a non-final failure so the queue can retry', async () => {
    gemini.generateReflectionFeedback.mockRejectedValue(new Error('timeout'));

    await expect(processor.process(job(0))).rejects.toThrow('timeout');

    expect(set).not.toHaveBeenCalled();
  });

  it('marks it failed with the reason on the last attempt', async () => {
    gemini.generateReflectionFeedback.mockRejectedValue(new Error('saída inválida'));

    await expect(processor.process(job(2))).rejects.toThrow('saída inválida');

    expect(set).toHaveBeenCalledWith({ feedbackStatus: 'failed', feedbackError: 'saída inválida' });
  });
});
