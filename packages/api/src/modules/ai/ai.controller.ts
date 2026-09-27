import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeChapterDto } from './dto/analyze-chapter.dto';
import { ReflectBookDto } from './dto/reflect-book.dto';
import { AiStatusResponseDto } from './dto/ai-status-response.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chapter')
  @ApiOperation({
    summary: 'Solicitar análise exegética e teológica de um capítulo da Bíblia',
    description:
      'Verifica primeiro o cache no PostgreSQL. Caso não exista, enfileira o processamento assíncrono via BullMQ e retorna o jobId para acompanhamento.',
  })
  @ApiResponse({ status: 200, type: AiStatusResponseDto })
  async analyzeChapter(@Body() dto: AnalyzeChapterDto): Promise<AiStatusResponseDto> {
    return this.aiService.requestChapterAnalysis(dto.bookAbbrev, dto.chapterNumber);
  }

  @Post('book')
  @ApiOperation({
    summary: 'Solicitar reflexão teológica panorâmica e esboço de um livro da Bíblia',
    description:
      'Verifica primeiro o cache no PostgreSQL. Caso não exista, enfileira o processamento assíncrono via BullMQ e retorna o jobId para acompanhamento.',
  })
  @ApiResponse({ status: 200, type: AiStatusResponseDto })
  async reflectBook(@Body() dto: ReflectBookDto): Promise<AiStatusResponseDto> {
    return this.aiService.requestBookReflection(dto.bookAbbrev);
  }

  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Consultar status ou resultado final de um processamento de IA',
  })
  @ApiResponse({ status: 200, type: AiStatusResponseDto })
  async getStatus(@Param('jobId') jobId: string): Promise<AiStatusResponseDto> {
    return this.aiService.getJobStatus(jobId);
  }
}
