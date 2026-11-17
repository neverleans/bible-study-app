import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { sql, eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { books, chapters, reflections, users } from '../../database/schema';
import type { Reflection } from '../../database/schema/reflections';
import { CreateReflectionDto, ReflectionDto } from './dto/reflection.dto';

function toDto(r: Reflection, bookAbbrev: string): ReflectionDto {
  return {
    id: r.id,
    bookAbbrev,
    chapterNumber: r.chapterNumber,
    content: r.content,
    feedbackStatus: r.feedbackStatus as ReflectionDto['feedbackStatus'],
    feedback: r.feedback ?? null,
    feedbackError: r.feedbackError ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

@Injectable()
export class ReflectionsService {
  private readonly logger = new Logger(ReflectionsService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    @InjectQueue('ai-analysis') private readonly queue: Queue,
  ) {}

  /** Saves the learner's text first (it is never lost), then asks the queue for AI feedback. */
  async create(userId: string, dto: CreateReflectionDto): Promise<ReflectionDto> {
    const { reflection, book, verses } = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const [bookRow] = await tx
        .select()
        .from(books)
        .where(eq(books.abbrev, dto.bookAbbrev.toLowerCase()))
        .limit(1);
      if (!bookRow) throw new NotFoundException(`Livro "${dto.bookAbbrev}" não encontrado`);

      const [chapter] = await tx
        .select({ verses: chapters.verses })
        .from(chapters)
        .where(and(eq(chapters.bookId, bookRow.id), eq(chapters.number, dto.chapterNumber)))
        .limit(1);
      if (!chapter) {
        throw new NotFoundException(`Capítulo ${dto.chapterNumber} de "${bookRow.name}" não encontrado`);
      }

      await tx
        .insert(users)
        .values({ id: userId, email: `${userId}@local.dev`, name: 'Usuário' })
        .onConflictDoNothing();

      const [row] = await tx
        .insert(reflections)
        .values({
          userId,
          bookId: bookRow.id,
          chapterNumber: dto.chapterNumber,
          content: dto.content.trim(),
        })
        .returning();
      return { reflection: row, book: bookRow, verses: chapter.verses };
    });

    try {
      await this.queue.add(
        'reflection-feedback',
        {
          reflectionId: reflection.id,
          userId,
          bookName: book.name,
          chapterNumber: dto.chapterNumber,
          versesText: verses.map((t, i) => `${i + 1}. ${t}`).join('\n'),
          verseCount: verses.length,
          learnerText: reflection.content,
        },
        {
          jobId: `reflection-${reflection.id}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      );
    } catch (err) {
      // Redis down: keep the saved text and tell the UI the feedback will not come.
      this.logger.error(`Falha ao enfileirar feedback da reflexão ${reflection.id}: ${err}`);
      return this.markFailed(userId, reflection, book.abbrev, 'Fila de IA indisponível.');
    }

    return toDto(reflection, book.abbrev);
  }

  private async markFailed(userId: string, reflection: Reflection, abbrev: string, message: string) {
    const failed = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      const [row] = await tx
        .update(reflections)
        .set({ feedbackStatus: 'failed', feedbackError: message })
        .where(eq(reflections.id, reflection.id))
        .returning();
      return row;
    });
    return toDto(failed, abbrev);
  }

  async list(userId: string, bookAbbrev: string, chapterNumber: number): Promise<ReflectionDto[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      const rows = await tx
        .select({ reflection: reflections, abbrev: books.abbrev })
        .from(reflections)
        .innerJoin(books, eq(reflections.bookId, books.id))
        .where(and(eq(books.abbrev, bookAbbrev.toLowerCase()), eq(reflections.chapterNumber, chapterNumber)))
        .orderBy(desc(reflections.createdAt))
        .limit(20);
      return rows.map((r) => toDto(r.reflection, r.abbrev));
    });
  }

  async get(userId: string, id: string): Promise<ReflectionDto> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      const [row] = await tx
        .select({ reflection: reflections, abbrev: books.abbrev })
        .from(reflections)
        .innerJoin(books, eq(reflections.bookId, books.id))
        .where(eq(reflections.id, id))
        .limit(1);
      if (!row) throw new NotFoundException('Reflexão não encontrada');
      return toDto(row.reflection, row.abbrev);
    });
  }
}
