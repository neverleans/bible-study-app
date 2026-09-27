import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { sql, eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { notes, books, users } from '../../database/schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Injectable()
export class NotesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getNotes(
    userId: string,
    bookAbbrev?: string,
    chapterNumber?: number,
    verseNumber?: number,
  ): Promise<NoteResponseDto[]> {
    return this.db.transaction(async (tx) => {
      // Set PostgreSQL session variable strictly within this transaction (is_local = true)
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
      );

      const conditions = [];

      if (bookAbbrev) {
        const bookList = await tx
          .select({ id: books.id })
          .from(books)
          .where(eq(books.abbrev, bookAbbrev.toLowerCase()))
          .limit(1);

        if (bookList.length > 0) {
          conditions.push(eq(notes.bookId, bookList[0].id));
        } else {
          return [];
        }
      }

      if (chapterNumber) {
        conditions.push(eq(notes.chapterNumber, chapterNumber));
      }

      if (verseNumber) {
        conditions.push(eq(notes.verseNumber, verseNumber));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await tx
        .select({
          id: notes.id,
          userId: notes.userId,
          bookAbbrev: books.abbrev,
          bookName: books.name,
          chapterNumber: notes.chapterNumber,
          verseNumber: notes.verseNumber,
          content: notes.content,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .innerJoin(books, eq(notes.bookId, books.id))
        .where(whereClause)
        .orderBy(desc(notes.createdAt));

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId || '',
        bookAbbrev: r.bookAbbrev,
        bookName: r.bookName,
        chapterNumber: r.chapterNumber,
        verseNumber: r.verseNumber,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    });
  }

  async createNote(userId: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    return this.db.transaction(async (tx) => {
      // Set RLS user context
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
      );

      // Ensure user record exists for foreign key constraint
      await tx
        .insert(users)
        .values({
          id: userId,
          email: `${userId}@local.dev`,
          name: 'Usuário',
        })
        .onConflictDoNothing();

      // Resolve book
      const bookList = await tx
        .select()
        .from(books)
        .where(eq(books.abbrev, dto.bookAbbrev.toLowerCase()))
        .limit(1);

      if (bookList.length === 0) {
        throw new NotFoundException(
          `Livro "${dto.bookAbbrev}" não encontrado`,
        );
      }

      const book = bookList[0];

      // Insert note — Row-Level Security validates user_id matches app.current_user_id
      const [inserted] = await tx
        .insert(notes)
        .values({
          userId,
          bookId: book.id,
          chapterNumber: dto.chapterNumber,
          verseNumber: dto.verseNumber,
          content: dto.content.trim(),
        })
        .returning();

      return {
        id: inserted.id,
        userId: inserted.userId || userId,
        bookAbbrev: book.abbrev,
        bookName: book.name,
        chapterNumber: inserted.chapterNumber,
        verseNumber: inserted.verseNumber,
        content: inserted.content,
        createdAt: inserted.createdAt.toISOString(),
        updatedAt: inserted.updatedAt.toISOString(),
      };
    });
  }

  async updateNote(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
      );

      // Update with RLS active: non-owners cannot see or update this row
      const updatedList = await tx
        .update(notes)
        .set({
          content: dto.content.trim(),
          updatedAt: new Date(),
        })
        .where(eq(notes.id, id))
        .returning();

      if (updatedList.length === 0) {
        throw new NotFoundException(
          `Nota com id "${id}" não encontrada ou acesso não autorizado`,
        );
      }

      const updated = updatedList[0];

      const [book] = await tx
        .select()
        .from(books)
        .where(eq(books.id, updated.bookId))
        .limit(1);

      return {
        id: updated.id,
        userId: updated.userId || userId,
        bookAbbrev: book.abbrev,
        bookName: book.name,
        chapterNumber: updated.chapterNumber,
        verseNumber: updated.verseNumber,
        content: updated.content,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }

  async deleteNote(userId: string, id: string): Promise<{ success: boolean }> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`,
      );

      const deleted = await tx
        .delete(notes)
        .where(eq(notes.id, id))
        .returning();

      if (deleted.length === 0) {
        throw new NotFoundException(
          `Nota com id "${id}" não encontrada ou acesso não autorizado`,
        );
      }

      return { success: true };
    });
  }
}
