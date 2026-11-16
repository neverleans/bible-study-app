import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OriginalService } from './original.service';
import { ChapterOriginalDto, LexiconEntryDto } from './dto/original.dto';

@ApiTags('original')
@Controller()
export class OriginalController {
  constructor(private readonly originalService: OriginalService) {}

  @Get('original/:book/:chapter')
  @ApiOperation({
    summary: 'Palavras originais (hebraico/grego) de um capítulo, com Strong e morfologia',
    description:
      'Dados: STEPBible (Tyndale House), CC BY 4.0. Versificação igual à do texto em português.',
  })
  @ApiResponse({ status: 200, type: ChapterOriginalDto })
  getChapter(
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ): Promise<ChapterOriginalDto> {
    return this.originalService.getChapter(book, chapter);
  }

  @Get('lexicon/:strong')
  @ApiOperation({ summary: 'Verbete do léxico para um número de Strong estendido' })
  @ApiResponse({ status: 200, type: LexiconEntryDto })
  @ApiResponse({ status: 404, description: 'Verbete não encontrado' })
  getLexiconEntry(@Param('strong') strong: string): Promise<LexiconEntryDto> {
    return this.originalService.getLexiconEntry(strong);
  }
}
