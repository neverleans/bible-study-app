import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../schema';
import * as dotenv from 'dotenv';

dotenv.config();

interface RawBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

async function main() {
  console.log('📖 Starting Bible data seed with Drizzle ORM...');

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://biblia:biblia@localhost:5434/biblia';
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  const dataPath = path.join(__dirname, 'data', 'bible-acf.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Bible data file not found at: ${dataPath}`);
  }

  const rawContent = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const rawBooks: RawBook[] = JSON.parse(rawContent);

  console.log(`Found ${rawBooks.length} books to seed.`);

  let totalChapters = 0;
  let totalVerses = 0;

  for (let i = 0; i < rawBooks.length; i++) {
    const rawBook = rawBooks[i];
    const order = i + 1;
    const testament = i < 39 ? 'OT' : 'NT';
    const chapterCount = rawBook.chapters.length;

    // Upsert Book
    const [book] = await db
      .insert(schema.books)
      .values({
        abbrev: rawBook.abbrev,
        name: rawBook.name,
        testament,
        chapterCount,
        order,
      })
      .onConflictDoUpdate({
        target: schema.books.abbrev,
        set: {
          name: rawBook.name,
          testament,
          chapterCount,
          order,
        },
      })
      .returning();

    const bookVersesToInsert: Array<{
      bookId: number;
      chapterId: number;
      number: number;
      text: string;
    }> = [];

    for (let c = 0; c < rawBook.chapters.length; c++) {
      const chapterNumber = c + 1;
      const verses = rawBook.chapters[c];

      // Upsert Chapter
      const [chapter] = await db
        .insert(schema.chapters)
        .values({
          bookId: book.id,
          number: chapterNumber,
          verses,
        })
        .onConflictDoUpdate({
          target: [schema.chapters.bookId, schema.chapters.number],
          set: { verses },
        })
        .returning();

      totalChapters++;

      for (let v = 0; v < verses.length; v++) {
        bookVersesToInsert.push({
          bookId: book.id,
          chapterId: chapter.id,
          number: v + 1,
          text: verses[v],
        });
      }
    }

    if (bookVersesToInsert.length > 0) {
      await db
        .insert(schema.verses)
        .values(bookVersesToInsert)
        .onConflictDoNothing();
      totalVerses += bookVersesToInsert.length;
    }

    if ((i + 1) % 10 === 0 || i === rawBooks.length - 1) {
      console.log(`  Processed ${i + 1}/${rawBooks.length} books (${rawBook.name}, ${totalVerses} verses)...`);
    }
  }

  console.log(`✅ Seeding complete! Seeded ${rawBooks.length} books, ${totalChapters} chapters, and ${totalVerses} verses.`);
  await client.end();
}

main().catch((e) => {
  console.error('❌ Seeding error:', e);
  process.exit(1);
});
