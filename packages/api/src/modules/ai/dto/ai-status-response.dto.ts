import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiStatusResponseDto {
  @ApiProperty({
    description: 'Estado atual do processamento da análise',
    example: 'completed',
    enum: ['completed', 'queued', 'active', 'waiting', 'failed'],
  })
  status: 'completed' | 'queued' | 'active' | 'waiting' | 'failed';

  @ApiPropertyOptional({ description: 'ID do job na fila BullMQ quando em processamento' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Indica se a resposta foi obtida instantaneamente do cache' })
  cached?: boolean;

  @ApiPropertyOptional({ description: 'Dados estruturados da análise quando concluída' })
  data?: any;

  @ApiPropertyOptional({ description: 'Mensagem de erro caso o processamento tenha falhado' })
  error?: string;
}
