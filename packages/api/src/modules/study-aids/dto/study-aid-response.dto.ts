import { ApiProperty } from '@nestjs/swagger';

export class StudyAidResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  bookId: number;

  @ApiProperty({ example: 'gn' })
  bookAbbrev: string;

  @ApiProperty({ example: 'Gênesis' })
  bookName: string;

  @ApiProperty({
    example: 'summary',
    enum: ['summary', 'key_verse', 'cross_ref', 'context'],
  })
  type: string;

  @ApiProperty({ example: 'A Criação do cosmos em seis dias...' })
  content: string;

  @ApiProperty({
    example: { chapterNumber: 1, title: 'A Criação do Céu e da Terra' },
  })
  metadata: Record<string, unknown>;

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z' })
  createdAt: string;
}
