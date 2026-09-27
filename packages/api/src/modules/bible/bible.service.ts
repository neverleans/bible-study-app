import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BookResponseDto } from './dto/book-response.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';

@Injectable()
export class BibleService {
  constructor(private prisma: PrismaService) {}

  async getBooks(testament?: string): Promise<BookResponseDto[]> {
    const where = testament ? { testament: testament.toUpperCase() } : {};
    return this.prisma.book.findMany({
      where,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        abbrev: true,
        name: true,
        testament: true,
        chapterCount: true,
        order: true,
      },
    });
  }

  async getBookByAbbrev(abbrev: string): Promise<BookResponseDto> {
    const book = await this.prisma.book.findUnique({
      where: { abbrev: abbrev.toLowerCase() },
      select: {
        id: true,
        abbrev: true,
        name: true,
        testament: true,
        chapterCount: true,
        order: true,
      },
    });

    if (!book) {
      throw new NotFoundException(`Livro com abreviação "${abbrev}" não encontrado`);
    }

    return book;
  }

  async getChapter(abbrev: string, chapterNumber: number): Promise<ChapterResponseDto> {
    const book = await this.getBookByAbbrev(abbrev);

    const chapter = await this.prisma.chapter.findUnique({
      where: {
        bookId_number: {
          bookId: book.id,
          number: chapterNumber,
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Capítulo ${chapterNumber} do livro "${book.name}" não encontrado`,
      );
    }

    // Compute navigation links
    let prevChapter = null;
    let nextChapter = null;

    if (chapterNumber > 1) {
      prevChapter = { bookAbbrev: book.abbrev, chapterNumber: chapterNumber - 1 };
    } else if (book.order > 1) {
      const prevBook = await this.prisma.book.findFirst({
        where: { order: book.order - 1 },
      });
      if (prevBook) {
        prevChapter = { bookAbbrev: prevBook.abbrev, chapterNumber: prevBook.chapterCount };
      }
    }

    if (chapterNumber < book.chapterCount) {
      nextChapter = { bookAbbrev: book.abbrev, chapterNumber: chapterNumber + 1 };
    } else if (book.order < 66) {
      const nextBook = await this.prisma.book.findFirst({
        where: { order: book.order + 1 },
      });
      if (nextBook) {
        nextChapter = { bookAbbrev: nextBook.abbrev, chapterNumber: 1 };
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
