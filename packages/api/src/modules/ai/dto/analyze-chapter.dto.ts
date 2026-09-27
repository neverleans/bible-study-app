import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AnalyzeChapterDto {
  @ApiProperty({ description: 'Abreviação do livro bíblico (ex: gn, mt, sl)', example: 'gn' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;

  @ApiProperty({ description: 'Número do capítulo bíblico', example: 1 })
  @IsInt()
  @Min(1)
  chapterNumber: number;
}
