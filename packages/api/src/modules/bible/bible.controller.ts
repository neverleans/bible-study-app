import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BibleService } from './bible.service';
import { BookResponseDto } from './dto/book-response.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';

@ApiTags('bible')
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('books')
  @ApiOperation({ summary: 'Listar livros da Bíblia' })
  @ApiQuery({
    name: 'testament',
    required: false,
    enum: ['OT', 'NT'],
    description: 'Filtrar por Antigo (OT) ou Novo (NT) Testamento',
  })
  @ApiResponse({ status: 200, type: [BookResponseDto] })
  async getBooks(@Query('testament') testament?: string): Promise<BookResponseDto[]> {
    return this.bibleService.getBooks(testament);
  }

  @Get('books/:abbrev')
  @ApiOperation({ summary: 'Obter detalhes de um livro' })
  @ApiParam({ name: 'abbrev', description: 'Abreviação do livro (ex: gn, mt)' })
  @ApiResponse({ status: 200, type: BookResponseDto })
  @ApiResponse({ status: 404, description: 'Livro não encontrado' })
  async getBook(@Param('abbrev') abbrev: string): Promise<BookResponseDto> {
    return this.bibleService.getBookByAbbrev(abbrev);
  }

  @Get('books/:abbrev/chapters/:number')
  @ApiOperation({ summary: 'Obter versículos de um capítulo' })
  @ApiParam({ name: 'abbrev', description: 'Abreviação do livro (ex: gn, mt)' })
  @ApiParam({ name: 'number', description: 'Número do capítulo' })
  @ApiResponse({ status: 200, type: ChapterResponseDto })
  @ApiResponse({ status: 404, description: 'Capítulo ou livro não encontrado' })
  async getChapter(
    @Param('abbrev') abbrev: string,
    @Param('number', ParseIntPipe) chapterNumber: number,
  ): Promise<ChapterResponseDto> {
    return this.bibleService.getChapter(abbrev, chapterNumber);
  }
}
