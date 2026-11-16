import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MarkChapterReadDto {
  @ApiProperty({ example: 'jn' })
  @IsString()
  @IsNotEmpty()
  bookAbbrev: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  chapterNumber: number;
}

export class ProgressResponseDto {
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() chapterNumber: number;
  @ApiProperty() completedAt: string;
}
