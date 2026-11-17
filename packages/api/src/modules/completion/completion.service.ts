import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { sql, eq, and, count, countDistinct, max } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { books, quizzes, quizAttempts, reflections, reviewCards } from '../../database/schema';
import { BookStatsDto } from './dto/completion.dto';

/**
 * Aggregates what the learner did in one book on the server side (quiz, explanations, review
 * cards). Reading progress and highlights are combined by the client: guests keep those locally.
 */
@Injectable()
export class CompletionService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getBookStats(userId: string, bookAbbrev: string): Promise<BookStatsDto> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const [book] = await tx
        .select()
        .from(books)
        .where(eq(books.abbrev, bookAbbrev.toLowerCase()))
        .limit(1);
      if (!book) throw new NotFoundException(`Livro "${bookAbbrev}" não encontrado`);

      // Best score per chapter. RLS limits quiz_attempts to this user.
      const bestRows = await tx
        .select({
          chapterNumber: quizzes.chapterNumber,
          bestScore: max(quizAttempts.score),
          total: max(quizAttempts.total),
        })
        .from(quizAttempts)
        .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
        .where(eq(quizzes.bookId, book.id))
        .groupBy(quizzes.chapterNumber)
        .orderBy(quizzes.chapterNumber);

      const quizBestByChapter = bestRows.map((r) => ({
        chapterNumber: r.chapterNumber,
        bestScore: r.bestScore ?? 0,
        total: r.total ?? 0,
      }));
      const percents = quizBestByChapter.filter((q) => q.total > 0).map((q) => (q.bestScore / q.total) * 100);
      const quizAveragePercent = percents.length
        ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
        : 0;

      const [refl] = await tx
        .select({ total: count(), chapters: countDistinct(reflections.chapterNumber) })
        .from(reflections)
        .where(eq(reflections.bookId, book.id));

      const [cards] = await tx
        .select({ total: count() })
        .from(reviewCards)
        .where(and(eq(reviewCards.bookId, book.id)));

      return {
        bookAbbrev: book.abbrev,
        bookName: book.name,
        chapterCount: book.chapterCount,
        quizBestByChapter,
        quizAveragePercent,
        reflectionCount: refl.total,
        reflectionChapters: refl.chapters,
        reviewCardCount: cards.total,
      };
    });
  }
}
