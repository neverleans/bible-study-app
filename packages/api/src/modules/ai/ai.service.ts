import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { eq, and, sql, isNull, or, gt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/schema';
import { books } from '../../database/schema/books';
import { chapters } from '../../database/schema/chapters';
import { aiCache } from '../../database/schema/ai-cache';
import { DRIZZLE } from '../../database/database.module';
import { AiStatusResponse, ChapterAnalysisResult, BookReflectionResult } from './interfaces/ai-analysis.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    @InjectQueue('ai-analysis') private readonly aiQueue: Queue,
  ) {}

  async requestChapterAnalysis(
    bookAbbrev: string,
    chapterNumber: number,
  ): Promise<AiStatusResponse> {
    const book = await this.findBookByAbbrev(bookAbbrev);
    const promptHash = this.hashString(`chapter_analysis:${book.id}:${chapterNumber}`);

    // Check PostgreSQL ai_cache first
    const cached = await this.getCachedAnalysis(promptHash);
    if (cached) {
      return {
        status: 'completed',
        cached: true,
        data: JSON.parse(cached.response) as ChapterAnalysisResult,
      };
    }

    // Fetch chapter verses text for context
    const [chapter] = await this.db
      .select({
        verses: chapters.verses,
      })
      .from(chapters)
      .where(and(eq(chapters.bookId, book.id), eq(chapters.number, chapterNumber)))
      .limit(1);

    if (!chapter) {
      throw new NotFoundException(
        `Capítulo ${chapterNumber} do livro '${book.name}' não encontrado.`,
      );
    }

    const versesText = chapter.verses
      .map((text, idx) => `${idx + 1}. ${text}`)
      .join('\n');

    const jobId = `chapter-${book.id}-${chapterNumber}`;

    // Check if job is already in queue
    const existingJob = await this.aiQueue.getJob(jobId);
    if (!existingJob) {
      await this.aiQueue.add(
        'chapter-analysis',
        {
          bookId: book.id,
          bookAbbrev: book.abbrev,
          bookName: book.name,
          chapterNumber,
          versesText,
          promptHash,
        },
        {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );
      this.logger.log(`Job enfileirado: ${jobId}`);
    }

    return {
      status: 'queued',
      jobId,
      cached: false,
    };
  }

  async requestBookReflection(bookAbbrev: string): Promise<AiStatusResponse> {
    const book = await this.findBookByAbbrev(bookAbbrev);
    const promptHash = this.hashString(`book_reflection:${book.id}`);

    // Check PostgreSQL ai_cache first
    const cached = await this.getCachedAnalysis(promptHash);
    if (cached) {
      return {
        status: 'completed',
        cached: true,
        data: JSON.parse(cached.response) as BookReflectionResult,
      };
    }

    const jobId = `book-${book.id}`;

    // Check if job is already in queue
    const existingJob = await this.aiQueue.getJob(jobId);
    if (!existingJob) {
      await this.aiQueue.add(
        'book-reflection',
        {
          bookId: book.id,
          bookAbbrev: book.abbrev,
          bookName: book.name,
          testament: book.testament,
          promptHash,
        },
        {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );
      this.logger.log(`Job enfileirado: ${jobId}`);
    }

    return {
      status: 'queued',
      jobId,
      cached: false,
    };
  }

  async getJobStatus(jobId: string): Promise<AiStatusResponse> {
    // Check if result is already persisted in ai_cache
    let promptHash: string | null = null;
    if (jobId.startsWith('chapter-')) {
      const parts = jobId.split('-');
      if (parts.length === 3) {
        promptHash = this.hashString(`chapter_analysis:${parts[1]}:${parts[2]}`);
      }
    } else if (jobId.startsWith('book-')) {
      const parts = jobId.split('-');
      if (parts.length === 2) {
        promptHash = this.hashString(`book_reflection:${parts[1]}`);
      }
    }

    if (promptHash) {
      const cached = await this.getCachedAnalysis(promptHash);
      if (cached) {
        return {
          status: 'completed',
          cached: true,
          data: JSON.parse(cached.response),
        };
      }
    }

    // Query BullMQ queue state
    const job = await this.aiQueue.getJob(jobId);
    if (!job) {
      return {
        status: 'failed',
        error: 'Job não encontrado ou expirado na fila de processamento.',
      };
    }

    const state = await job.getState();

    if (state === 'completed') {
      return {
        status: 'completed',
        data: job.returnvalue,
      };
    }

    if (state === 'failed') {
      return {
        status: 'failed',
        error: job.failedReason || 'Falha no processamento da análise com IA.',
      };
    }

    return {
      status: state as 'active' | 'waiting',
      jobId,
    };
  }

  private async findBookByAbbrev(abbrev: string) {
    const [book] = await this.db
      .select()
      .from(books)
      .where(sql`lower(${books.abbrev}) = lower(${abbrev})`)
      .limit(1);

    if (!book) {
      throw new NotFoundException(`Livro com abreviação '${abbrev}' não encontrado.`);
    }

    return book;
  }

  private async getCachedAnalysis(promptHash: string) {
    const [cached] = await this.db
      .select()
      .from(aiCache)
      .where(
        and(
          eq(aiCache.promptHash, promptHash),
          or(isNull(aiCache.expiresAt), gt(aiCache.expiresAt, sql`NOW()`)),
        ),
      )
      .limit(1);

    return cached || null;
  }

  private hashString(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
