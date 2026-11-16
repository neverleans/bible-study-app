import { ApiProperty } from '@nestjs/swagger';

export class OriginalWordDto {
  @ApiProperty() position: number;
  @ApiProperty({ description: 'Palavra em hebraico ou grego' }) surface: string;
  @ApiProperty({ type: String, nullable: true }) transliteration: string | null;
  @ApiProperty({ type: String, nullable: true, description: 'Glosa em inglês (STEPBible)' }) gloss: string | null;
  @ApiProperty({ type: String, nullable: true, description: 'Strong estendido, ex.: H1697G' }) strong: string | null;
  @ApiProperty({ type: String, nullable: true }) morph: string | null;
  @ApiProperty({ type: String, nullable: true }) lemma: string | null;
}

export class OriginalVerseDto {
  @ApiProperty() verseNumber: number;
  @ApiProperty({ type: [OriginalWordDto] }) words: OriginalWordDto[];
}

export class ChapterOriginalDto {
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() chapterNumber: number;
  @ApiProperty({ enum: ['heb', 'grc'] }) lang: 'heb' | 'grc';
  @ApiProperty({ description: 'false quando os originais deste livro ainda não foram importados' })
  available: boolean;
  @ApiProperty({ type: [OriginalVerseDto] }) verses: OriginalVerseDto[];
}

export class LexiconEntryDto {
  @ApiProperty() strong: string;
  @ApiProperty({ enum: ['heb', 'grc'] }) lang: string;
  @ApiProperty() lemma: string;
  @ApiProperty({ type: String, nullable: true }) transliteration: string | null;
  @ApiProperty({ type: String, nullable: true }) morph: string | null;
  @ApiProperty({ type: String, nullable: true }) gloss: string | null;
  @ApiProperty({ type: String, nullable: true }) meaning: string | null;
}
