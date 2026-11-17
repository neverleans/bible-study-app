import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength, Min } from 'class-validator';
import { REFLECTION_MAX_CHARS, REFLECTION_MIN_CHARS } from '../reflections.schemas';

export class CreateReflectionDto {
  @ApiProperty({ example: 'jn' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({
    description: 'O que você entendeu do capítulo, com suas palavras',
    minLength: REFLECTION_MIN_CHARS,
    maxLength: REFLECTION_MAX_CHARS,
  })
  @IsString()
  @MinLength(REFLECTION_MIN_CHARS)
  @MaxLength(REFLECTION_MAX_CHARS)
  content: string;
}

export class MisunderstandingDto {
  @ApiProperty() claim: string;
  @ApiProperty() correction: string;
  @ApiProperty() verse: number;
}

export class ReflectionFeedbackDto {
  @ApiProperty({ type: [String] }) coveredPoints: string[];
  @ApiProperty({ type: [String] }) missingPoints: string[];
  @ApiProperty({ type: [MisunderstandingDto] }) misunderstandings: MisunderstandingDto[];
  @ApiProperty() encouragement: string;
}

export class ReflectionDto {
  @ApiProperty() id: string;
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() chapterNumber: number;
  @ApiProperty() content: string;
  @ApiProperty({ enum: ['pending', 'done', 'failed'] }) feedbackStatus: 'pending' | 'done' | 'failed';
  @ApiProperty({ type: ReflectionFeedbackDto, nullable: true }) feedback: ReflectionFeedbackDto | null;
  @ApiProperty({ type: String, nullable: true }) feedbackError: string | null;
  @ApiProperty() createdAt: string;
}
