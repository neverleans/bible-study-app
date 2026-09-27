import { ApiProperty } from '@nestjs/swagger';

export class SearchResultItemDto {
  @ApiProperty({ example: 1 })
  verseId: number;

  @ApiProperty({ example: 'Gênesis' })
  bookName: string;

  @ApiProperty({ example: 'gn' })
  bookAbbrev: string;

  @ApiProperty({ example: 'OT' })
  testament: string;

  @ApiProperty({ example: 1 })
  chapterNumber: number;

  @ApiProperty({ example: 1 })
  verseNumber: number;

  @ApiProperty({ example: 'No princípio criou Deus os céus e a terra.' })
  text: string;

  @ApiProperty({
    example: 'No princípio criou <mark>Deus</mark> os céus e a terra.',
  })
  highlight: string;
}

export class SearchResponseDto {
  @ApiProperty({ example: 263 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 14 })
  totalPages: number;

  @ApiProperty({ type: [SearchResultItemDto] })
  results: SearchResultItemDto[];
}
