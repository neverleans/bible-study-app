/**
 * Writes packages/api/openapi.json, the API contract the frontend types are generated from.
 *
 *   pnpm --filter api openapi:generate
 *
 * Needs no running Postgres or Redis: the Nest app is created (so every decorator is read) but
 * never listens, and connections are lazy/ignored. The frontend runs `openapi-typescript` on the
 * result; CI fails if either generated file is out of date.
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { buildOpenApiConfig } from '../swagger';

// Config validation needs these to exist; the values are never used to connect.
process.env.DATABASE_URL ??= 'postgresql://contract:contract@127.0.0.1:1/contract';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '1';
process.env.FRONTEND_URL ??= 'http://localhost:5173';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig());

  const target = path.join(__dirname, '..', '..', 'openapi.json');
  fs.writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`OpenAPI written to ${target}`);

  // Redis clients retry in the background; skip a graceful close that would wait on them.
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
