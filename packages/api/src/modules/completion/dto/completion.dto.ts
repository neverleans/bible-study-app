import { ApiProperty } from '@nestjs/swagger';

export class ChapterQuizBestDto {
  @ApiProperty() chapterNumber: number;
  @ApiProperty({ description: 'Melhor nota entre as tentativas' }) bestScore: number;
  @ApiProperty() total: number;
}

export class BookStatsDto {
  @ApiProperty() bookAbbrev: string;
  @ApiProperty() bookName: string;
  @ApiProperty({ description: 'Capítulos do livro' }) chapterCount: number;
  @ApiProperty({ type: [ChapterQuizBestDto], description: 'Melhor nota por capítulo com quiz tentado' })
  quizBestByChapter: ChapterQuizBestDto[];
  @ApiProperty({ description: 'Média das melhores notas (0 a 100); 0 se não houver tentativas' })
  quizAveragePercent: number;
  @ApiProperty({ description: 'Explicações escritas neste livro' }) reflectionCount: number;
  @ApiProperty({ description: 'Capítulos com pelo menos uma explicação' }) reflectionChapters: number;
  @ApiProperty({ description: 'Cartões de revisão deste livro' }) reviewCardCount: number;
}
