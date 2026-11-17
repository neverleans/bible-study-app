import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { sql, eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { books, chapters, quizzes, quizAttempts, users } from '../../database/schema';
import { QUIZ_PROMPT_VERSION } from './quiz.schemas';
import {
  AttemptResultDto,
  AttemptSummaryDto,
  ChapterQuizStatusDto,
  PublicQuizQuestionDto,
} from './dto/quiz.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    @InjectQueue('ai-analysis') private readonly queue: Queue,
  ) {}

  private jobId(bookId: number, chapterNumber: number): string {
    return `quiz-${bookId}-${chapterNumber}`;
  }

  private async findBook(abbrev: string) {
    const [book] = await this.db
      .select()
      .from(books)
      .where(eq(books.abbrev, abbrev.toLowerCase()))
      .limit(1);
    if (!book) throw new NotFoundException(`Livro "${abbrev}" não encontrado`);
    return book;
  }

  private async findQuiz(bookId: number, chapterNumber: number) {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(
        and(
          eq(quizzes.bookId, bookId),
          eq(quizzes.chapterNumber, chapterNumber),
          eq(quizzes.promptVersion, QUIZ_PROMPT_VERSION),
        ),
      )
      .limit(1);
    return quiz ?? null;
  }

  /** The answer key and explanations stay on the server until an attempt is graded. */
  private toPublic(
    questions: { question: string; options: string[]; verse: number }[],
  ): PublicQuizQuestionDto[] {
    return questions.map(({ question, options, verse }) => ({ question, options, verse }));
  }

  async getChapterQuiz(bookAbbrev: string, chapterNumber: number): Promise<ChapterQuizStatusDto> {
    const book = await this.findBook(bookAbbrev);
    const quiz = await this.findQuiz(book.id, chapterNumber);
    if (quiz) {
      return { status: 'ready', quizId: quiz.id, questions: this.toPublic(quiz.questions) };
    }

    const job = await this.queue.getJob(this.jobId(book.id, chapterNumber));
    if (!job) return { status: 'none' };
    const state = await job.getState();
    if (state === 'failed') {
      return { status: 'failed', error: job.failedReason || 'Falha ao gerar o quiz.' };
    }
    return { status: 'generating' };
  }

  async requestGeneration(bookAbbrev: string, chapterNumber: number): Promise<ChapterQuizStatusDto> {
    const book = await this.findBook(bookAbbrev);
    const existing = await this.findQuiz(book.id, chapterNumber);
    if (existing) {
      return { status: 'ready', quizId: existing.id, questions: this.toPublic(existing.questions) };
    }

    const [chapter] = await this.db
      .select({ verses: chapters.verses })
      .from(chapters)
      .where(and(eq(chapters.bookId, book.id), eq(chapters.number, chapterNumber)))
      .limit(1);
    if (!chapter) {
      throw new NotFoundException(`Capítulo ${chapterNumber} de "${book.name}" não encontrado`);
    }

    const jobId = this.jobId(book.id, chapterNumber);
    const job = await this.queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      if (state !== 'failed') return { status: 'generating' };
      await job.remove(); // lets the user retry a failed generation
    }

    await this.queue.add(
      'chapter-quiz',
      {
        bookId: book.id,
        bookName: book.name,
        chapterNumber,
        versesText: chapter.verses.map((t, i) => `${i + 1}. ${t}`).join('\n'),
        verseCount: chapter.verses.length,
      },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      },
    );
    this.logger.log(`Job de quiz enfileirado: ${jobId}`);
    return { status: 'generating' };
  }

  async submitAttempt(userId: string, quizId: string, answers: number[]): Promise<AttemptResultDto> {
    const [quiz] = await this.db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    if (!quiz) throw new NotFoundException('Quiz não encontrado');
    if (answers.length !== quiz.questions.length) {
      throw new BadRequestException(`Responda todas as ${quiz.questions.length} perguntas.`);
    }

    const results = quiz.questions.map((q, i) => ({
      questionIndex: i,
      chosenIndex: answers[i],
      correctIndex: q.correctIndex,
      correct: answers[i] === q.correctIndex,
      explanation: q.explanation,
      verse: q.verse,
    }));
    const score = results.filter((r) => r.correct).length;

    const attemptId = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      await tx
        .insert(users)
        .values({ id: userId, email: `${userId}@local.dev`, name: 'Usuário' })
        .onConflictDoNothing();
      const [row] = await tx
        .insert(quizAttempts)
        .values({ userId, quizId, answers, score, total: results.length })
        .returning({ id: quizAttempts.id });
      return row.id;
    });

    return { attemptId, score, total: results.length, results };
  }

  async getAttempts(userId: string, quizId: string): Promise<AttemptSummaryDto[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      const rows = await tx
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.quizId, quizId))
        .orderBy(desc(quizAttempts.createdAt));
      return rows.map((r) => ({
        id: r.id,
        score: r.score,
        total: r.total,
        createdAt: r.createdAt.toISOString(),
      }));
    });
  }
}
