import { ApiProperty } from '@nestjs/swagger';

export class NoteResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 'gn' })
  bookAbbrev: string;

  @ApiProperty({ example: 'Gênesis' })
  bookName: string;

  @ApiProperty({ example: 1 })
  chapterNumber: number;

  @ApiProperty({ example: 1 })
  verseNumber: number;

  @ApiProperty({ example: 'Reflexão sobre a criação...' })
  content: string;

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z' })
  updatedAt: string;
}
