import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { sql, eq, and, lte, asc, count } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { books, chapters, reviewCards, users } from '../../database/schema';
import type { ReviewCard } from '../../database/schema/review-cards';
import { nextSchedule, Grade } from './sm2';
import { DueCardsDto, ReviewCardDto, ReviewSummaryDto } from './dto/review.dto';

const DEFAULT_LIMIT = 20;

type Row = ReviewCard & { bookAbbrev: string; bookName: string };

function toDto(r: Row): ReviewCardDto {
  return {
    id: r.id,
    kind: r.kind as 'verse' | 'quiz',
    bookAbbrev: r.bookAbbrev,
    bookName: r.bookName,
    chapterNumber: r.chapterNumber,
    verseNumber: r.verseNumber,
    prompt: r.prompt,
    answer: r.answer,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
    dueAt: r.dueAt.toISOString(),
  };
}

@Injectable()
export class ReviewService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  private async withUser<T>(userId: string, fn: (tx: Parameters<Parameters<DrizzleDb['transaction']>[0]>[0]) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
      return fn(tx);
    });
  }

  async getSummary(userId: string, now = new Date()): Promise<ReviewSummaryDto> {
    return this.withUser(userId, async (tx) => {
      const [all] = await tx.select({ n: count() }).from(reviewCards);
      const [due] = await tx.select({ n: count() }).from(reviewCards).where(lte(reviewCards.dueAt, now));
      return { due: due.n, total: all.n };
    });
  }

  async getDue(userId: string, limit = DEFAULT_LIMIT, now = new Date()): Promise<DueCardsDto> {
    return this.withUser(userId, async (tx) => {
      const [{ n }] = await tx.select({ n: count() }).from(reviewCards).where(lte(reviewCards.dueAt, now));
      const rows = await tx
        .select({
          card: reviewCards,
          bookAbbrev: books.abbrev,
          bookName: books.name,
        })
        .from(reviewCards)
        .innerJoin(books, eq(reviewCards.bookId, books.id))
        .where(lte(reviewCards.dueAt, now))
        .orderBy(asc(reviewCards.dueAt))
        .limit(Math.min(Math.max(limit, 1), 50));
      return {
        totalDue: n,
        cards: rows.map((r) => toDto({ ...r.card, bookAbbrev: r.bookAbbrev, bookName: r.bookName })),
      };
    });
  }

  /** Adds a verse to review. Idempotent: asking twice returns the same card. */
  async createVerseCard(
    userId: string,
    bookAbbrev: string,
    chapterNumber: number,
    verseNumber: number,
  ): Promise<ReviewCardDto> {
    return this.withUser(userId, async (tx) => {
      const [book] = await tx.select().from(books).where(eq(books.abbrev, bookAbbrev.toLowerCase())).limit(1);
      if (!book) throw new NotFoundException(`Livro "${bookAbbrev}" não encontrado`);

      const [chapter] = await tx
        .select({ verses: chapters.verses })
        .from(chapters)
        .where(and(eq(chapters.bookId, book.id), eq(chapters.number, chapterNumber)))
        .limit(1);
      const text = chapter?.verses[verseNumber - 1];
      if (!text) {
        throw new NotFoundException(`Versículo ${book.name} ${chapterNumber}:${verseNumber} não encontrado`);
      }

      await tx
        .insert(users)
        .values({ id: userId, email: `${userId}@local.dev`, name: 'Usuário' })
        .onConflictDoNothing();

      const sourceKey = `verse:${chapterNumber}:${verseNumber}`;
      await tx
        .insert(reviewCards)
        .values({
          userId,
          bookId: book.id,
          chapterNumber,
          verseNumber,
          kind: 'verse',
          sourceKey,
          prompt: `Recite ${book.name} ${chapterNumber}:${verseNumber}`,
          answer: text,
        })
        .onConflictDoNothing();

      const [card] = await tx
        .select()
        .from(reviewCards)
        .where(and(eq(reviewCards.bookId, book.id), eq(reviewCards.sourceKey, sourceKey)))
        .limit(1);
      return toDto({ ...card, bookAbbrev: book.abbrev, bookName: book.name });
    });
  }

  async grade(userId: string, id: string, grade: Grade, now = new Date()): Promise<ReviewCardDto> {
    return this.withUser(userId, async (tx) => {
      const [row] = await tx
        .select({ card: reviewCards, bookAbbrev: books.abbrev, bookName: books.name })
        .from(reviewCards)
        .innerJoin(books, eq(reviewCards.bookId, books.id))
        .where(eq(reviewCards.id, id))
        .limit(1);
      if (!row) throw new NotFoundException('Cartão não encontrado');

      const next = nextSchedule(
        { ease: row.card.ease, intervalDays: row.card.intervalDays, repetitions: row.card.repetitions },
        grade,
        now,
      );
      const [updated] = await tx
        .update(reviewCards)
        .set({
          ease: next.ease,
          intervalDays: next.intervalDays,
          repetitions: next.repetitions,
          dueAt: next.dueAt,
          lastReviewedAt: now,
        })
        .where(eq(reviewCards.id, id))
        .returning();
      return toDto({ ...updated, bookAbbrev: row.bookAbbrev, bookName: row.bookName });
    });
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    return this.withUser(userId, async (tx) => {
      const deleted = await tx.delete(reviewCards).where(eq(reviewCards.id, id)).returning();
      if (deleted.length === 0) throw new NotFoundException('Cartão não encontrado');
      return { success: true };
    });
  }
}
