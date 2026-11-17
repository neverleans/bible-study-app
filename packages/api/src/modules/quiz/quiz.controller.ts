import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import {
  AttemptResultDto,
  AttemptSummaryDto,
  ChapterQuizStatusDto,
  SubmitAttemptDto,
} from './dto/quiz.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('quiz')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('chapter/:book/:chapter')
  @ApiOperation({ summary: 'Estado do quiz do capítulo (sem gabarito)' })
  @ApiResponse({ status: 200, type: ChapterQuizStatusDto })
  getChapterQuiz(
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ): Promise<ChapterQuizStatusDto> {
    return this.quizService.getChapterQuiz(book, chapter);
  }

  @Post('chapter/:book/:chapter/generate')
  @ApiOperation({
    summary: 'Pedir a geração do quiz do capítulo pela IA (assíncrono, via fila)',
    description: 'Se o quiz já existir, devolve-o. Senão enfileira o job e devolve status "generating".',
  })
  @ApiResponse({ status: 201, type: ChapterQuizStatusDto })
  generate(
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ): Promise<ChapterQuizStatusDto> {
    return this.quizService.requestGeneration(book, chapter);
  }

  @Post(':quizId/attempts')
  @ApiOperation({ summary: 'Enviar respostas; a correção é feita no servidor' })
  @ApiResponse({ status: 201, type: AttemptResultDto })
  submitAttempt(
    @CurrentUserId() userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: SubmitAttemptDto,
  ): Promise<AttemptResultDto> {
    return this.quizService.submitAttempt(userId, quizId, dto.answers);
  }

  @Get(':quizId/attempts')
  @ApiOperation({ summary: 'Minhas tentativas neste quiz (RLS)' })
  @ApiResponse({ status: 200, type: [AttemptSummaryDto] })
  getAttempts(
    @CurrentUserId() userId: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ): Promise<AttemptSummaryDto[]> {
    return this.quizService.getAttempts(userId, quizId);
  }
}
