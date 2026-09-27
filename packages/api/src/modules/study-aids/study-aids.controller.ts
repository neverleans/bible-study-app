import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StudyAidsService } from './study-aids.service';
import { StudyAidResponseDto } from './dto/study-aid-response.dto';

@ApiTags('study-aids')
@Controller('study-aids')
export class StudyAidsController {
  constructor(private readonly studyAidsService: StudyAidsService) {}

  @Get('book/:abbrev')
  @ApiOperation({
    summary: 'Listar recursos de estudo (introdução, contexto, versículos-chave) de um livro',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['summary', 'key_verse', 'cross_ref', 'context'],
    description: 'Filtrar por tipo de recurso de estudo',
  })
  @ApiResponse({ status: 200, type: [StudyAidResponseDto] })
  async getStudyAidsByBook(
    @Param('abbrev') abbrev: string,
    @Query('type') type?: string,
  ): Promise<StudyAidResponseDto[]> {
    return this.studyAidsService.getStudyAidsByBook(abbrev, type);
  }

  @Get('chapter/:abbrev/:chapterNumber')
  @ApiOperation({
    summary: 'Listar recursos de estudo, resumo e referências cruzadas de um capítulo específico',
  })
  @ApiResponse({ status: 200, type: [StudyAidResponseDto] })
  async getStudyAidsByChapter(
    @Param('abbrev') abbrev: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ): Promise<StudyAidResponseDto[]> {
    return this.studyAidsService.getStudyAidsByChapter(abbrev, chapterNumber);
  }
}
