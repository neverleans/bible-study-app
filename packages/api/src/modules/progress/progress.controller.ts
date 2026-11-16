import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { MarkChapterReadDto, ProgressResponseDto } from './dto/progress.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('progress')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Listar capítulos lidos (protegidos por RLS)' })
  @ApiQuery({ name: 'book', required: false })
  @ApiResponse({ status: 200, type: [ProgressResponseDto] })
  getProgress(
    @CurrentUserId() userId: string,
    @Query('book') book?: string,
  ): Promise<ProgressResponseDto[]> {
    return this.progressService.getProgress(userId, book);
  }

  @Put()
  @ApiOperation({ summary: 'Marcar um capítulo como lido (idempotente)' })
  @ApiResponse({ status: 200, type: ProgressResponseDto })
  markRead(
    @CurrentUserId() userId: string,
    @Body() dto: MarkChapterReadDto,
  ): Promise<ProgressResponseDto> {
    return this.progressService.markRead(userId, dto);
  }

  @Delete(':book/:chapter')
  @ApiOperation({ summary: 'Desmarcar um capítulo como lido' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Capítulo não estava marcado' })
  unmarkRead(
    @CurrentUserId() userId: string,
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ): Promise<{ success: boolean }> {
    return this.progressService.unmarkRead(userId, book, chapter);
  }
}
