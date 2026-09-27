import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, IsUrl, validateSync, IsOptional } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsNumber()
  API_PORT: number;

  @IsUrl({ require_tld: false })
  FRONTEND_URL: string;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      REDIS_PORT: config.REDIS_PORT ? parseInt(config.REDIS_PORT as string, 10) : 6379,
      API_PORT: config.API_PORT ? parseInt(config.API_PORT as string, 10) : 3000,
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
