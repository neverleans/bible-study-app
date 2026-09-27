import { ApiProperty } from '@nestjs/swagger';
import { BookResponseDto } from './book-response.dto';

export class VerseDto {
  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 'No princípio criou Deus os céus e a terra.' })
  text: string;
}

export class ChapterNavigationDto {
  @ApiProperty({ example: 'gn' })
  bookAbbrev: string;

  @ApiProperty({ example: 1 })
  chapterNumber: number;
}

export class ChapterResponseDto {
  @ApiProperty({ type: BookResponseDto })
  book: BookResponseDto;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ type: [VerseDto] })
  verses: VerseDto[];

  @ApiProperty({ type: ChapterNavigationDto, nullable: true })
  prevChapter: ChapterNavigationDto | null;

  @ApiProperty({ type: ChapterNavigationDto, nullable: true })
  nextChapter: ChapterNavigationDto | null;
}
