import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { HIGHLIGHT_COLORS, HighlightColor } from '../../../database/schema/highlights';

export class UpsertHighlightDto {
  @ApiProperty({ description: 'Abreviação do livro', example: 'jn' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  verseNumber: number;

  @ApiProperty({ enum: HIGHLIGHT_COLORS, example: 'person' })
  @IsIn(HIGHLIGHT_COLORS as unknown as string[])
  color: HighlightColor;
}

export class HighlightResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() chapterNumber: number;
  @ApiProperty() verseNumber: number;
  @ApiProperty({ enum: HIGHLIGHT_COLORS }) color: HighlightColor;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
