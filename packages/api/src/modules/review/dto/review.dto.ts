import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateVerseCardDto {
  @ApiProperty({ example: 'jn' })
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
}

export class GradeCardDto {
  @ApiProperty({ enum: ['again', 'good', 'easy'], description: 'Errei / Acertei / Fácil' })
  @IsIn(['again', 'good', 'easy'])
  grade: 'again' | 'good' | 'easy';
}

export class ReviewCardDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['verse', 'quiz'] }) kind: 'verse' | 'quiz';
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() bookName: string;
  @ApiProperty() chapterNumber: number;
  @ApiProperty({ type: Number, nullable: true }) verseNumber: number | null;
  @ApiProperty({ description: 'O que a pessoa tenta lembrar' }) prompt: string;
  @ApiProperty({ description: 'Resposta mostrada depois de tentar lembrar' }) answer: string;
  @ApiProperty() intervalDays: number;
  @ApiProperty() repetitions: number;
  @ApiProperty() dueAt: string;
}

export class ReviewSummaryDto {
  @ApiProperty({ description: 'Cartões para revisar agora' }) due: number;
  @ApiProperty({ description: 'Total de cartões' }) total: number;
}

export class DueCardsDto {
  @ApiProperty() totalDue: number;
  @ApiProperty({ type: [ReviewCardDto] }) cards: ReviewCardDto[];
}
