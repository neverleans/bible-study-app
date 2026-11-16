import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OriginalWordDto {
  @ApiProperty() position: number;
  @ApiProperty({ description: 'Palavra em hebraico ou grego' }) surface: string;
  @ApiPropertyOptional({ nullable: true }) transliteration: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Glosa em inglês (STEPBible)' }) gloss: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Strong estendido, ex.: H1697G' }) strong: string | null;
  @ApiPropertyOptional({ nullable: true }) morph: string | null;
  @ApiPropertyOptional({ nullable: true }) lemma: string | null;
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
  @ApiPropertyOptional({ nullable: true }) transliteration: string | null;
  @ApiPropertyOptional({ nullable: true }) morph: string | null;
  @ApiPropertyOptional({ nullable: true }) gloss: string | null;
  @ApiPropertyOptional({ nullable: true }) meaning: string | null;
}
