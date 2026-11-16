import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { originalWords, lexiconEntries, books } from '../../database/schema';
import {
  ChapterOriginalDto,
  LexiconEntryDto,
  OriginalWordDto,
} from './dto/original.dto';

/**
 * Extended Strong keys vary by sense ("H1697G", sub-meaning "H1697H"). Try the exact key,
 * then the bare number, then the main-sense suffix "G".
 */
export function strongCandidates(strong: string): string[] {
  const base = strong.slice(0, 5);
  return [...new Set([strong, base, `${base}G`])];
}

@Injectable()
export class OriginalService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async getChapter(bookAbbrev: string, chapterNumber: number): Promise<ChapterOriginalDto> {
    const [book] = await this.db
      .select()
      .from(books)
      .where(eq(books.abbrev, bookAbbrev.toLowerCase()))
      .limit(1);
    if (!book) throw new NotFoundException(`Livro "${bookAbbrev}" não encontrado`);

    const rows = await this.db
      .select()
      .from(originalWords)
      .where(and(eq(originalWords.bookId, book.id), eq(originalWords.chapterNumber, chapterNumber)))
      .orderBy(asc(originalWords.verseNumber), asc(originalWords.position));

    const verses = new Map<number, OriginalWordDto[]>();
    for (const r of rows) {
      const list = verses.get(r.verseNumber) ?? [];
      list.push({
        position: r.position,
        surface: r.surface,
        transliteration: r.transliteration,
        gloss: r.gloss,
        strong: r.strong,
        morph: r.morph,
        lemma: r.lemma,
      });
      verses.set(r.verseNumber, list);
    }

    return {
      bookAbbrev: book.abbrev,
      chapterNumber,
      lang: rows[0]?.lang === 'grc' ? 'grc' : 'heb',
      available: rows.length > 0,
      verses: [...verses.entries()].map(([verseNumber, words]) => ({ verseNumber, words })),
    };
  }

  async getLexiconEntry(strong: string): Promise<LexiconEntryDto> {
    const candidates = strongCandidates(strong);
    const rows = await this.db
      .select()
      .from(lexiconEntries)
      .where(inArray(lexiconEntries.strong, candidates));

    const entry = candidates.map((c) => rows.find((r) => r.strong === c)).find(Boolean);
    if (!entry) throw new NotFoundException(`Verbete "${strong}" não encontrado`);
    return entry;
  }
}
