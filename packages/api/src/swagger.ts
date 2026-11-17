import { DocumentBuilder } from '@nestjs/swagger';

/** Shared by the running API (`/api/docs`) and the contract generator, so both describe the same API. */
export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Bible Study API')
    .setDescription('The Bible Study API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
}
