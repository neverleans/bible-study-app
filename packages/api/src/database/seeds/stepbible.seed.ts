/**
 * Seeds the interlinear layer from STEPBible-Data files (CC BY 4.0, Tyndale House / STEPBible.org).
 *
 *   pnpm db:seed:original <dir> [--books=jn,mc]
 *
 * <dir> must hold the downloaded files, named by prefix: tahot*.txt, tagnt*.txt, tbesh*.txt,
 * tbesg*.txt (case-insensitive). --books limits the import to ACF abbreviations (e.g. the
 * pilot books). Run with a database user allowed to INSERT into the two tables.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as schema from '../schema';
import {
  parseTahotLine,
  parseTagntLine,
  parseLexiconLine,
  ParsedWord,
  createPositionAllocator,
  ParsedLexiconEntry,
} from './stepbible.parser';

dotenv.config();

const BATCH = 1000;

function findFiles(dir: string, prefix: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().startsWith(prefix) && f.toLowerCase().endsWith('.txt'))
    .map((f) => path.join(dir, f));
}

function readLines(file: string): string[] {
  return fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '').split(/\r?\n/);
}

async function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    throw new Error('Usage: db:seed:original <dir-with-stepbible-files> [--books=jn,mc]');
  }
  const booksArg = process.argv.find((a) => a.startsWith('--books='));
  const onlyAbbrevs = booksArg ? booksArg.slice(8).split(',').map((s) => s.trim().toLowerCase()) : null;

  const client = postgres(
    process.env.DATABASE_URL || 'postgresql://biblia:biblia@localhost:5434/biblia',
  );
  const db = drizzle(client, { schema });

  const bookRows = await db.select().from(schema.books);
  const idByOrder = new Map(bookRows.map((b) => [b.order, b]));
  const allowedOrders = onlyAbbrevs
    ? new Set(bookRows.filter((b) => onlyAbbrevs.includes(b.abbrev)).map((b) => b.order))
    : null;

  // 1) Lexicon
  const lexicon = new Map<string, ParsedLexiconEntry>();
  for (const file of [...findFiles(dir, 'tbesh'), ...findFiles(dir, 'tbesg')]) {
    for (const line of readLines(file)) {
      const entry = parseLexiconLine(line);
      if (entry) lexicon.set(entry.strong, entry);
    }
  }
  const entries = [...lexicon.values()];
  for (let i = 0; i < entries.length; i += BATCH) {
    await db
      .insert(schema.lexiconEntries)
      .values(entries.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: schema.lexiconEntries.strong,
        set: {
          lemma: sql`excluded.lemma`,
          transliteration: sql`excluded.transliteration`,
          morph: sql`excluded.morph`,
          gloss: sql`excluded.gloss`,
          meaning: sql`excluded.meaning`,
        },
      });
  }
  console.log(`Lexicon entries: ${entries.length}`);

  // 2) Words
  const parsers: [string, (l: string) => ParsedWord | null][] = [
    ['tahot', parseTahotLine],
    ['tagnt', parseTagntLine],
  ];
  let total = 0;
  for (const [prefix, parse] of parsers) {
    for (const file of findFiles(dir, prefix)) {
      const nextPosition = createPositionAllocator();
      let batch: (typeof schema.originalWords.$inferInsert)[] = [];
      const flush = async () => {
        if (batch.length === 0) return;
        await db
          .insert(schema.originalWords)
          .values(batch)
          .onConflictDoUpdate({
            target: [
              schema.originalWords.bookId,
              schema.originalWords.chapterNumber,
              schema.originalWords.verseNumber,
              schema.originalWords.position,
            ],
            set: {
              surface: sql`excluded.surface`,
              transliteration: sql`excluded.transliteration`,
              gloss: sql`excluded.gloss`,
              strong: sql`excluded.strong`,
              morph: sql`excluded.morph`,
              lemma: sql`excluded.lemma`,
            },
          });
        total += batch.length;
        batch = [];
      };
      for (const line of readLines(file)) {
        const w = parse(line);
        if (!w || (allowedOrders && !allowedOrders.has(w.bookOrder))) continue;
        const book = idByOrder.get(w.bookOrder);
        if (!book) continue;
        batch.push({
          bookId: book.id,
          chapterNumber: w.chapterNumber,
          verseNumber: w.verseNumber,
          position: nextPosition(w),
          lang: w.lang,
          surface: w.surface,
          transliteration: w.transliteration,
          gloss: w.gloss,
          strong: w.strong,
          morph: w.morph,
          lemma: w.lemma,
        });
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      console.log(`${path.basename(file)} done`);
    }
  }
  console.log(`Original words upserted: ${total}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
