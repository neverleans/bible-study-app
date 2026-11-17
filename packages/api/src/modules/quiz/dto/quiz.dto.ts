import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class SubmitAttemptDto {
  @ApiProperty({ type: [Number], description: 'Índice da alternativa escolhida em cada pergunta, na ordem' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers: number[];
}

export class PublicQuizQuestionDto {
  @ApiProperty() question: string;
  @ApiProperty({ type: [String] }) options: string[];
  @ApiProperty({ description: 'Versículo em que a pergunta se baseia' }) verse: number;
}

export class ChapterQuizStatusDto {
  @ApiProperty({ enum: ['none', 'generating', 'ready', 'failed'] })
  status: 'none' | 'generating' | 'ready' | 'failed';
  @ApiPropertyOptional() quizId?: string;
  @ApiPropertyOptional({ type: [PublicQuizQuestionDto] }) questions?: PublicQuizQuestionDto[];
  @ApiPropertyOptional() error?: string;
}

export class QuestionResultDto {
  @ApiProperty() questionIndex: number;
  @ApiProperty() chosenIndex: number;
  @ApiProperty() correctIndex: number;
  @ApiProperty() correct: boolean;
  @ApiProperty() explanation: string;
  @ApiProperty() verse: number;
}

export class AttemptResultDto {
  @ApiProperty() attemptId: string;
  @ApiProperty() score: number;
  @ApiProperty() total: number;
  @ApiProperty({ type: [QuestionResultDto] }) results: QuestionResultDto[];
}

export class AttemptSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() score: number;
  @ApiProperty() total: number;
  @ApiProperty() createdAt: string;
}
