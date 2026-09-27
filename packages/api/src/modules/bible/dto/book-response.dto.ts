import { ApiProperty } from '@nestjs/swagger';

export class BookResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'gn' })
  abbrev: string;

  @ApiProperty({ example: 'Gênesis' })
  name: string;

  @ApiProperty({ example: 'OT', enum: ['OT', 'NT'] })
  testament: string;

  @ApiProperty({ example: 50 })
  chapterCount: number;

  @ApiProperty({ example: 1 })
  order: number;
}
