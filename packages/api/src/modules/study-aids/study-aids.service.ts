import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/schema';
import { books } from '../../database/schema/books';
import { studyAids } from '../../database/schema/study-aids';
import { DRIZZLE } from '../../database/database.module';
import { StudyAidResponseDto } from './dto/study-aid-response.dto';

@Injectable()
export class StudyAidsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getStudyAidsByBook(
    bookAbbrev: string,
    type?: string,
  ): Promise<StudyAidResponseDto[]> {
    const book = await this.findBook(bookAbbrev);

    const conditions = [eq(studyAids.bookId, book.id)];
    if (type) {
      conditions.push(eq(studyAids.type, type));
    }

    const rows = await this.db
      .select({
        id: studyAids.id,
        bookId: studyAids.bookId,
        bookAbbrev: books.abbrev,
        bookName: books.name,
        type: studyAids.type,
        content: studyAids.content,
        metadata: studyAids.metadata,
        createdAt: studyAids.createdAt,
      })
      .from(studyAids)
      .innerJoin(books, eq(studyAids.bookId, books.id))
      .where(and(...conditions))
      .orderBy(studyAids.id);

    return rows.map((r) => ({
      ...r,
      metadata: (r.metadata as Record<string, unknown>) || {},
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getStudyAidsByChapter(
    bookAbbrev: string,
    chapterNumber: number,
  ): Promise<StudyAidResponseDto[]> {
    const book = await this.findBook(bookAbbrev);

    const rows = await this.db
      .select({
        id: studyAids.id,
        bookId: studyAids.bookId,
        bookAbbrev: books.abbrev,
        bookName: books.name,
        type: studyAids.type,
        content: studyAids.content,
        metadata: studyAids.metadata,
        createdAt: studyAids.createdAt,
      })
      .from(studyAids)
      .innerJoin(books, eq(studyAids.bookId, books.id))
      .where(
        and(
          eq(studyAids.bookId, book.id),
          sql`(${studyAids.metadata}->>'chapterNumber')::int = ${chapterNumber}`,
        ),
      )
      .orderBy(studyAids.id);

    return rows.map((r) => ({
      ...r,
      metadata: (r.metadata as Record<string, unknown>) || {},
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private async findBook(abbrev: string) {
    const [book] = await this.db
      .select()
      .from(books)
      .where(sql`lower(${books.abbrev}) = lower(${abbrev})`)
      .limit(1);

    if (!book) {
      throw new NotFoundException(`Livro '${abbrev}' não encontrado.`);
    }

    return book;
  }
}
