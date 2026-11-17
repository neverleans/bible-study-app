import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HighlightsService } from './highlights.service';
import { HighlightResponseDto, UpsertHighlightDto } from './dto/highlight.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('highlights')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar destaques do usuário (protegidos por RLS)' })
  @ApiQuery({ name: 'book', required: false })
  @ApiQuery({ name: 'chapter', required: false, type: Number })
  @ApiResponse({ status: 200, type: [HighlightResponseDto] })
  getHighlights(
    @CurrentUserId() userId: string,
    @Query('book') book?: string,
    @Query('chapter') chapter?: string,
  ): Promise<HighlightResponseDto[]> {
    const chapterNum = chapter ? parseInt(chapter, 10) : undefined;
    return this.highlightsService.getHighlights(userId, book, chapterNum);
  }

  @Put()
  @ApiOperation({ summary: 'Criar ou trocar a cor do destaque de um versículo' })
  @ApiResponse({ status: 200, type: HighlightResponseDto })
  upsertHighlight(
    @CurrentUserId() userId: string,
    @Body() dto: UpsertHighlightDto,
  ): Promise<HighlightResponseDto> {
    return this.highlightsService.upsertHighlight(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um destaque (somente o autor via RLS)' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'Destaque não encontrado ou acesso não autorizado' })
  deleteHighlight(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.highlightsService.deleteHighlight(userId, id);
  }
}
