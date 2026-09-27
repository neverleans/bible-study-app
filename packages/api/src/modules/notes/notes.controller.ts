import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('notes')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  required: false,
  description: 'ID do usuário para isolamento estrito via PostgreSQL Row-Level Security (RLS) quando não autenticado por JWT',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notas do usuário autenticado (protegidas por RLS)' })
  @ApiQuery({ name: 'book', required: false, description: 'Abreviação do livro (ex: gn)' })
  @ApiQuery({ name: 'chapter', required: false, type: Number, description: 'Número do capítulo' })
  @ApiQuery({ name: 'verse', required: false, type: Number, description: 'Número do versículo' })
  @ApiResponse({ status: 200, type: [NoteResponseDto] })
  async getNotes(
    @CurrentUserId() userId: string,
    @Query('book') book?: string,
    @Query('chapter') chapter?: string,
    @Query('verse') verse?: string,
  ): Promise<NoteResponseDto[]> {
    const chapterNum = chapter ? parseInt(chapter, 10) : undefined;
    const verseNum = verse ? parseInt(verse, 10) : undefined;
    return this.notesService.getNotes(userId, book, chapterNum, verseNum);
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova nota de estudo para um versículo' })
  @ApiResponse({ status: 201, type: NoteResponseDto })
  async createNote(
    @CurrentUserId() userId: string,
    @Body() dto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.createNote(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar conteúdo de uma nota (somente o autor via RLS)' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  @ApiResponse({ status: 404, description: 'Nota não encontrada ou acesso não autorizado' })
  async updateNote(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.updateNote(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma nota (somente o autor via RLS)' })
  @ApiResponse({ status: 200, description: 'Nota excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Nota não encontrada ou acesso não autorizado' })
  async deleteNote(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.notesService.deleteNote(userId, id);
  }
}
