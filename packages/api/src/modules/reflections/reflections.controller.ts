import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReflectionsService } from './reflections.service';
import { CreateReflectionDto, ReflectionDto } from './dto/reflection.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('reflections')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('reflections')
export class ReflectionsController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Salvar “explique com suas palavras” e pedir feedback da IA (assíncrono)',
    description: 'O texto é salvo na hora; o feedback chega depois (status pending → done | failed).',
  })
  @ApiResponse({ status: 201, type: ReflectionDto })
  create(@CurrentUserId() userId: string, @Body() dto: CreateReflectionDto): Promise<ReflectionDto> {
    return this.reflectionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Minhas explicações de um capítulo, as mais recentes primeiro' })
  @ApiQuery({ name: 'book', required: true })
  @ApiQuery({ name: 'chapter', required: true, type: Number })
  @ApiResponse({ status: 200, type: [ReflectionDto] })
  list(
    @CurrentUserId() userId: string,
    @Query('book') book: string,
    @Query('chapter', ParseIntPipe) chapter: number,
  ): Promise<ReflectionDto[]> {
    return this.reflectionsService.list(userId, book, chapter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Uma explicação e o estado do seu feedback' })
  @ApiResponse({ status: 200, type: ReflectionDto })
  @ApiResponse({ status: 404, description: 'Não encontrada ou de outra pessoa (RLS)' })
  get(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReflectionDto> {
    return this.reflectionsService.get(userId, id);
  }
}
