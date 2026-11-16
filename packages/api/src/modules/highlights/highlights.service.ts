import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { sql, eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { highlights, books, users } from '../../database/schema';
import { HighlightColor } from '../../database/schema/highlights';
import { HighlightResponseDto, UpsertHighlightDto } from './dto/highlight.dto';

@Injectable()
export class HighlightsService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getHighlights(
    userId: string,
    bookAbbrev?: string,
    chapterNumber?: number,
  ): Promise<HighlightResponseDto[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const conditions = [];
      if (bookAbbrev) conditions.push(eq(books.abbrev, bookAbbrev.toLowerCase()));
      if (chapterNumber) conditions.push(eq(highlights.chapterNumber, chapterNumber));

      const rows = await tx
        .select({
          id: highlights.id,
          bookAbbrev: books.abbrev,
          chapterNumber: highlights.chapterNumber,
          verseNumber: highlights.verseNumber,
          color: highlights.color,
          createdAt: highlights.createdAt,
          updatedAt: highlights.updatedAt,
        })
        .from(highlights)
        .innerJoin(books, eq(highlights.bookId, books.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(highlights.createdAt));

      return rows.map((r) => ({
        id: r.id,
        bookAbbrev: r.bookAbbrev,
        chapterNumber: r.chapterNumber,
        verseNumber: r.verseNumber,
        color: r.color as HighlightColor,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    });
  }

  /** Creates the highlight or changes its color (one highlight per verse). */
  async upsertHighlight(userId: string, dto: UpsertHighlightDto): Promise<HighlightResponseDto> {
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

      const [row] = await tx
        .insert(highlights)
        .values({
          userId,
          bookId: book.id,
          chapterNumber: dto.chapterNumber,
          verseNumber: dto.verseNumber,
          color: dto.color,
        })
        .onConflictDoUpdate({
          target: [
            highlights.userId,
            highlights.bookId,
            highlights.chapterNumber,
            highlights.verseNumber,
          ],
          set: { color: dto.color, updatedAt: new Date() },
        })
        .returning();

      return {
        id: row.id,
        bookAbbrev: book.abbrev,
        chapterNumber: row.chapterNumber,
        verseNumber: row.verseNumber,
        color: row.color as HighlightColor,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  async deleteHighlight(userId: string, id: string): Promise<{ success: boolean }> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      const deleted = await tx.delete(highlights).where(eq(highlights.id, id)).returning();
      if (deleted.length === 0) {
        throw new NotFoundException(
          `Destaque com id "${id}" não encontrado ou acesso não autorizado`,
        );
      }
      return { success: true };
    });
  }
}
