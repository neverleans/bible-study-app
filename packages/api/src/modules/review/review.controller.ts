import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import {
  CreateVerseCardDto,
  DueCardsDto,
  GradeCardDto,
  ReviewCardDto,
  ReviewSummaryDto,
} from './dto/review.dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('review')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Quantos cartões estão para revisar agora' })
  @ApiResponse({ status: 200, type: ReviewSummaryDto })
  summary(@CurrentUserId() userId: string): Promise<ReviewSummaryDto> {
    return this.reviewService.getSummary(userId);
  }

  @Get('due')
  @ApiOperation({ summary: 'Cartões para revisar agora, os mais atrasados primeiro' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: DueCardsDto })
  due(
    @CurrentUserId() userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<DueCardsDto> {
    return this.reviewService.getDue(userId, limit);
  }

  @Post('cards')
  @ApiOperation({ summary: 'Adicionar um versículo à revisão espaçada (idempotente)' })
  @ApiResponse({ status: 201, type: ReviewCardDto })
  createVerseCard(
    @CurrentUserId() userId: string,
    @Body() dto: CreateVerseCardDto,
  ): Promise<ReviewCardDto> {
    return this.reviewService.createVerseCard(userId, dto.bookAbbrev, dto.chapterNumber, dto.verseNumber);
  }

  @Post('cards/:id/grade')
  @ApiOperation({ summary: 'Avaliar a lembrança (errei/acertei/fácil) e reagendar o cartão' })
  @ApiResponse({ status: 201, type: ReviewCardDto })
  grade(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GradeCardDto,
  ): Promise<ReviewCardDto> {
    return this.reviewService.grade(userId, id, dto.grade);
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: 'Remover um cartão da revisão' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponseDto> {
    return this.reviewService.remove(userId, id);
  }
}
