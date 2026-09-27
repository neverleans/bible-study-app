import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReflectBookDto {
  @ApiProperty({ description: 'Abreviação do livro bíblico (ex: rm, jo, ap)', example: 'rm' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;
}
