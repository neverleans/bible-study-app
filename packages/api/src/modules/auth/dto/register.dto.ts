import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SenhaForte123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve conter no mínimo 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsString()
  @IsOptional()
  name?: string;
}
