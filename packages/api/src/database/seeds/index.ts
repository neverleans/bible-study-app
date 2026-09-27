import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RawBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

async function main() {
  console.log('📖 Starting Bible data seed...');

  const dataPath = path.join(__dirname, 'data', 'bible-acf.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Bible data file not found at: ${dataPath}`);
  }

  const rawContent = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const books: RawBook[] = JSON.parse(rawContent);

  console.log(`Found ${books.length} books to seed.`);

  let totalChapters = 0;

  for (let i = 0; i < books.length; i++) {
    const rawBook = books[i];
    const order = i + 1;
    const testament = i < 39 ? 'OT' : 'NT';
    const chapterCount = rawBook.chapters.length;

    const book = await prisma.book.upsert({
      where: { abbrev: rawBook.abbrev },
      update: {
        name: rawBook.name,
        testament,
        chapterCount,
        order,
      },
      create: {
        abbrev: rawBook.abbrev,
        name: rawBook.name,
        testament,
        chapterCount,
        order,
      },
    });

    for (let c = 0; c < rawBook.chapters.length; c++) {
      const chapterNumber = c + 1;
      const verses = rawBook.chapters[c];

      await prisma.chapter.upsert({
        where: {
          bookId_number: {
            bookId: book.id,
            number: chapterNumber,
          },
        },
        update: { verses },
        create: {
          bookId: book.id,
          number: chapterNumber,
          verses,
        },
      });

      totalChapters++;
    }

    if ((i + 1) % 10 === 0 || i === books.length - 1) {
      console.log(`  Processed ${i + 1}/${books.length} books (${rawBook.name})...`);
    }
  }

  console.log(`✅ Seeding complete! Seeded ${books.length} books and ${totalChapters} chapters.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
