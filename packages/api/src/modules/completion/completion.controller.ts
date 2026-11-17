import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { CompletionService } from './completion.service';
import { BookStatsDto } from './dto/completion.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('completion')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('completion')
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Get(':book')
  @ApiOperation({ summary: 'O que a pessoa fez neste livro (quiz, explicações, cartões) para o cartão de conclusão' })
  @ApiResponse({ status: 200, type: BookStatsDto })
  @ApiResponse({ status: 404, description: 'Livro não encontrado' })
  getBookStats(@CurrentUserId() userId: string, @Param('book') book: string): Promise<BookStatsDto> {
    return this.completionService.getBookStats(userId, book);
  }
}
