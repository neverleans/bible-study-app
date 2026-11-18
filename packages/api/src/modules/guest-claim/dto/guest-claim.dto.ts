import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ClaimGuestDto {
  @ApiProperty({ description: 'ID de visitante guardado neste navegador (UUID)' })
  @IsUUID()
  guestId: string;
}

export class ClaimGuestResultDto {
  @ApiProperty({ description: 'Tentativas de quiz trazidas para a conta' }) quizAttempts: number;
  @ApiProperty({ description: 'Cartões de revisão trazidos (os que a conta já tinha são mantidos)' }) reviewCards: number;
  @ApiProperty({ description: 'Explicações escritas trazidas para a conta' }) reflections: number;
}
