import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Termo de busca', example: 'amor' })
  @IsString()
  @MinLength(2, { message: 'O termo de busca deve ter pelo menos 2 caracteres' })
  q: string;

  @ApiPropertyOptional({ description: 'Página de resultados', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filtrar por testamento', enum: ['OT', 'NT'] })
  @IsOptional()
  @IsString()
  testament?: string;

  @ApiPropertyOptional({ description: 'Filtrar por abreviação do livro (ex: gn, mt)' })
  @IsOptional()
  @IsString()
  book?: string;
}
