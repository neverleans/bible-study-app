import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Abreviação do livro', example: 'gn' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;

  @ApiProperty({ description: 'Número do capítulo', example: 1 })
  @IsInt()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({ description: 'Número do versículo', example: 1 })
  @IsInt()
  @Min(1)
  verseNumber: number;

  @ApiProperty({ description: 'Conteúdo da nota', example: 'Reflexão sobre a criação...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
