import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { sql, eq, and, asc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { readingProgress, books, users } from '../../database/schema';
import { MarkChapterReadDto, ProgressResponseDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getProgress(userId: string, bookAbbrev?: string): Promise<ProgressResponseDto[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const rows = await tx
        .select({
          bookAbbrev: books.abbrev,
          chapterNumber: readingProgress.chapterNumber,
          completedAt: readingProgress.completedAt,
        })
        .from(readingProgress)
        .innerJoin(books, eq(readingProgress.bookId, books.id))
        .where(bookAbbrev ? eq(books.abbrev, bookAbbrev.toLowerCase()) : undefined)
        .orderBy(asc(books.order), asc(readingProgress.chapterNumber));

      return rows.map((r) => ({
        bookAbbrev: r.bookAbbrev,
        chapterNumber: r.chapterNumber,
        completedAt: r.completedAt.toISOString(),
      }));
    });
  }

  /** Idempotent: marking an already-read chapter just refreshes its date. */
  async markRead(userId: string, dto: MarkChapterReadDto): Promise<ProgressResponseDto> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      await tx
        .insert(users)
        .values({ id: userId, email: `${userId}@local.dev`, name: 'Usuário' })
        .onConflictDoNothing();

      const [book] = await tx
        .select()
        .from(books)
        .where(eq(books.abbrev, dto.bookAbbrev.toLowerCase()))
        .limit(1);

      if (!book) {
        throw new NotFoundException(`Livro "${dto.bookAbbrev}" não encontrado`);
      }
      if (dto.chapterNumber > book.chapterCount) {
        throw new NotFoundException(
          `Capítulo ${dto.chapterNumber} não existe em "${book.name}"`,
        );
      }

      const [row] = await tx
        .insert(readingProgress)
        .values({ userId, bookId: book.id, chapterNumber: dto.chapterNumber })
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.bookId, readingProgress.chapterNumber],
          set: { completedAt: new Date() },
        })
        .returning();

      return {
        bookAbbrev: book.abbrev,
        chapterNumber: row.chapterNumber,
        completedAt: row.completedAt.toISOString(),
      };
    });
  }

  async unmarkRead(
    userId: string,
    bookAbbrev: string,
    chapterNumber: number,
  ): Promise<{ success: boolean }> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const [book] = await tx
        .select()
        .from(books)
        .where(eq(books.abbrev, bookAbbrev.toLowerCase()))
        .limit(1);

      if (!book) {
        throw new NotFoundException(`Livro "${bookAbbrev}" não encontrado`);
      }

      const deleted = await tx
        .delete(readingProgress)
        .where(
          and(
            eq(readingProgress.bookId, book.id),
            eq(readingProgress.chapterNumber, chapterNumber),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        throw new NotFoundException('Capítulo não estava marcado como lido');
      }
      return { success: true };
    });
  }
}
