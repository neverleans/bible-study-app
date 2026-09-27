import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'usuario@exemplo.com' })
  email: string;

  @ApiPropertyOptional({ example: 'João da Silva' })
  name?: string | null;

  @ApiProperty({ example: 'local' })
  provider: string;

  @ApiProperty({ example: '2026-09-27T10:00:00.000Z' })
  createdAt: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;
}
