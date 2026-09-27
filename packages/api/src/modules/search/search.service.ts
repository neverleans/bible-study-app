import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '../../database/database.module';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';

@Injectable()
export class SearchService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async search(query: SearchQueryDto): Promise<SearchResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;
    const searchTerm = query.q.trim();

    // Build filter SQL conditions safely
    const conditions = [
      sql`v.search_vector @@ plainto_tsquery('portuguese', ${searchTerm})`,
    ];

    if (query.testament) {
      conditions.push(sql`b.testament = ${query.testament.toUpperCase()}`);
    }

    if (query.book) {
      conditions.push(sql`b.abbrev = ${query.book.toLowerCase()}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    // Count total matching verses
    const countResult = await this.db.execute<{ count: number }>(sql`
      SELECT count(*)::int AS count
      FROM verses v
      JOIN books b ON b.id = v.book_id
      WHERE ${whereClause};
    `);

    const total = Number(countResult[0]?.count || 0);

    if (total === 0) {
      return {
        total: 0,
        page,
        limit,
        totalPages: 0,
        results: [],
      };
    }

    // Query paginated results with ts_rank and ts_headline
    const results = await this.db.execute<{
      verseId: number;
      bookName: string;
      bookAbbrev: string;
      testament: string;
      chapterNumber: number;
      verseNumber: number;
      text: string;
      highlight: string;
    }>(sql`
      SELECT 
        v.id AS "verseId",
        b.name AS "bookName",
        b.abbrev AS "bookAbbrev",
        b.testament AS "testament",
        c.number AS "chapterNumber",
        v.number AS "verseNumber",
        v.text AS "text",
        ts_headline(
          'portuguese',
          v.text,
          plainto_tsquery('portuguese', ${searchTerm}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=60, MinWords=20'
        ) AS "highlight"
      FROM verses v
      JOIN chapters c ON c.id = v.chapter_id
      JOIN books b ON b.id = v.book_id
      WHERE ${whereClause}
      ORDER BY 
        ts_rank_cd(v.search_vector, plainto_tsquery('portuguese', ${searchTerm})) DESC,
        b.order ASC,
        c.number ASC,
        v.number ASC
      LIMIT ${limit} OFFSET ${offset};
    `);

    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      results: results.map((r) => ({
        verseId: Number(r.verseId),
        bookName: r.bookName,
        bookAbbrev: r.bookAbbrev,
        testament: r.testament,
        chapterNumber: Number(r.chapterNumber),
        verseNumber: Number(r.verseNumber),
        text: r.text,
        highlight: r.highlight,
      })),
    };
  }
}
