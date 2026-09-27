import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../database/schema';
import { aiCache } from '../../../database/schema/ai-cache';
import { DRIZZLE } from '../../../database/database.module';
import { GeminiService } from '../services/gemini.service';
import {
  ChapterAnalysisResult,
  BookReflectionResult,
} from '../interfaces/ai-analysis.interface';

@Processor('ai-analysis')
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly geminiService: GeminiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Iniciando processamento do job ${job.id} (${job.name})`);

    try {
      if (job.name === 'chapter-analysis') {
        return await this.processChapterAnalysis(job);
      } else if (job.name === 'book-reflection') {
        return await this.processBookReflection(job);
      } else {
        throw new Error(`Tipo de job desconhecido: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Falha no processamento do job ${job.id}: ${error}`);
      throw error;
    }
  }

  private async processChapterAnalysis(job: Job): Promise<ChapterAnalysisResult> {
    const { bookId, bookName, chapterNumber, versesText, promptHash } = job.data;

    const result = await this.geminiService.generateChapterAnalysis(
      bookName,
      chapterNumber,
      versesText || '',
    );

    // Save or update in PostgreSQL ai_cache
    await this.db
      .insert(aiCache)
      .values({
        bookId,
        chapterNumber,
        analysisType: 'chapter_analysis',
        promptHash,
        response: JSON.stringify(result),
        metadata: { generatedAt: new Date().toISOString() },
      })
      .onConflictDoUpdate({
        target: aiCache.promptHash,
        set: {
          response: JSON.stringify(result),
          metadata: { generatedAt: new Date().toISOString() },
        },
      });

    this.logger.log(`Análise de ${bookName} ${chapterNumber} concluída e gravada em ai_cache.`);
    return result;
  }

  private async processBookReflection(job: Job): Promise<BookReflectionResult> {
    const { bookId, bookName, testament, promptHash } = job.data;

    const result = await this.geminiService.generateBookReflection(
      bookName,
      testament,
    );

    // Save or update in PostgreSQL ai_cache
    await this.db
      .insert(aiCache)
      .values({
        bookId,
        chapterNumber: null,
        analysisType: 'book_reflection',
        promptHash,
        response: JSON.stringify(result),
        metadata: { generatedAt: new Date().toISOString() },
      })
      .onConflictDoUpdate({
        target: aiCache.promptHash,
        set: {
          response: JSON.stringify(result),
          metadata: { generatedAt: new Date().toISOString() },
        },
      });

    this.logger.log(`Reflexão sobre o livro ${bookName} concluída e gravada em ai_cache.`);
    return result;
  }
}
