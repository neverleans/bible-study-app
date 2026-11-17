import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../database/schema';
import { aiCache } from '../../../database/schema/ai-cache';
import { quizzes } from '../../../database/schema/quizzes';
import { reflections } from '../../../database/schema/reflections';
import { QUIZ_PROMPT_VERSION } from '../../quiz/quiz.schemas';
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
      } else if (job.name === 'chapter-quiz') {
        return await this.processChapterQuiz(job);
      } else if (job.name === 'reflection-feedback') {
        return await this.processReflectionFeedback(job);
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

  private async processChapterQuiz(job: Job): Promise<{ quizId: string }> {
    const { bookId, bookName, chapterNumber, versesText, verseCount } = job.data;

    const questions = await this.geminiService.generateChapterQuiz(
      bookName,
      chapterNumber,
      versesText,
      verseCount,
    );

    // Keep the first quiz if two jobs raced: attempts already reference its id.
    await this.db
      .insert(quizzes)
      .values({
        bookId,
        chapterNumber,
        promptVersion: QUIZ_PROMPT_VERSION,
        model: this.geminiService.model,
        questions,
      })
      .onConflictDoNothing();

    const [quiz] = await this.db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(
        and(
          eq(quizzes.bookId, bookId),
          eq(quizzes.chapterNumber, chapterNumber),
          eq(quizzes.promptVersion, QUIZ_PROMPT_VERSION),
        ),
      )
      .limit(1);

    this.logger.log(`Quiz de ${bookName} ${chapterNumber} gravado.`);
    return { quizId: quiz.id };
  }

  /**
   * The worker has no HTTP user, so it sets the owner as the RLS user for the update. On the
   * last failed attempt the reflection is marked failed so the UI stops waiting.
   */
  private async processReflectionFeedback(job: Job): Promise<{ reflectionId: string }> {
    const { reflectionId, userId, bookName, chapterNumber, versesText, verseCount, learnerText } =
      job.data;

    const saveAs = async (values: Partial<typeof reflections.$inferInsert>) =>
      this.db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
        await tx.update(reflections).set(values).where(eq(reflections.id, reflectionId));
      });

    try {
      const feedback = await this.geminiService.generateReflectionFeedback(
        bookName,
        chapterNumber,
        versesText,
        verseCount,
        learnerText,
      );
      await saveAs({ feedback, feedbackStatus: 'done', feedbackError: null });
      return { reflectionId };
    } catch (error) {
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (isLastAttempt) {
        await saveAs({
          feedbackStatus: 'failed',
          feedbackError: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
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
