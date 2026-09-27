import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { books, chapters } from '../../database/schema';
import { BookResponseDto } from './dto/book-response.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';

@Injectable()
export class BibleService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getBooks(testament?: string): Promise<BookResponseDto[]> {
    if (testament) {
      return this.db
        .select()
        .from(books)
        .where(eq(books.testament, testament.toUpperCase()))
        .orderBy(asc(books.order));
    }
    return this.db.select().from(books).orderBy(asc(books.order));
  }

  async getBookByAbbrev(abbrev: string): Promise<BookResponseDto> {
    const result = await this.db
      .select()
      .from(books)
      .where(eq(books.abbrev, abbrev.toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Livro com abreviação "${abbrev}" não encontrado`);
    }

    return result[0];
  }

  async getChapter(abbrev: string, chapterNumber: number): Promise<ChapterResponseDto> {
    const book = await this.getBookByAbbrev(abbrev);

    const chapterList = await this.db
      .select()
      .from(chapters)
      .where(and(eq(chapters.bookId, book.id), eq(chapters.number, chapterNumber)))
      .limit(1);

    if (chapterList.length === 0) {
      throw new NotFoundException(
        `Capítulo ${chapterNumber} do livro "${book.name}" não encontrado`,
      );
    }

    const chapter = chapterList[0];

    // Compute navigation links
    let prevChapter = null;
    let nextChapter = null;

    if (chapterNumber > 1) {
      prevChapter = { bookAbbrev: book.abbrev, chapterNumber: chapterNumber - 1 };
    } else if (book.order > 1) {
      const prevBookList = await this.db
        .select()
        .from(books)
        .where(eq(books.order, book.order - 1))
        .limit(1);
      if (prevBookList.length > 0) {
        prevChapter = {
          bookAbbrev: prevBookList[0].abbrev,
          chapterNumber: prevBookList[0].chapterCount,
        };
      }
    }

    if (chapterNumber < book.chapterCount) {
      nextChapter = { bookAbbrev: book.abbrev, chapterNumber: chapterNumber + 1 };
    } else if (book.order < 66) {
      const nextBookList = await this.db
        .select()
        .from(books)
        .where(eq(books.order, book.order + 1))
        .limit(1);
      if (nextBookList.length > 0) {
        nextChapter = { bookAbbrev: nextBookList[0].abbrev, chapterNumber: 1 };
      }
    }

    return {
      book,
      number: chapter.number,
      verses: chapter.verses.map((text, idx) => ({
        number: idx + 1,
        text,
      })),
      prevChapter,
      nextChapter,
    };
  }
}
