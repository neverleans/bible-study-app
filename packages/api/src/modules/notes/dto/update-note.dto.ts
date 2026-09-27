import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ description: 'Conteúdo atualizado da nota', example: 'Nova reflexão...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
