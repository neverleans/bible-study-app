import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SearchController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/search?q=amor (GET) should return search results with highlights and pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/search?q=amor&limit=10')
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.totalPages).toBeGreaterThan(0);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeLessThanOrEqual(10);
    expect(res.body.results[0].bookName).toBeDefined();
    expect(res.body.results[0].chapterNumber).toBeGreaterThan(0);
    expect(res.body.results[0].verseNumber).toBeGreaterThan(0);
    expect(res.body.results[0].highlight).toContain('<mark');
  });

  it('/search?q=amor&testament=NT (GET) should filter by New Testament', async () => {
    const res = await request(app.getHttpServer())
      .get('/search?q=amor&testament=NT')
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.results.every((r: any) => r.testament === 'NT')).toBe(true);
  });

  it('/search?q=amor&book=1co (GET) should filter by 1 Coríntios', async () => {
    const res = await request(app.getHttpServer())
      .get('/search?q=amor&book=1co')
      .expect(200);

    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.results.every((r: any) => r.bookAbbrev === '1co')).toBe(true);
  });

  it('/search?q=a (GET) should reject query shorter than 2 chars with 400', async () => {
    await request(app.getHttpServer())
      .get('/search?q=a')
      .expect(400);
  });
});
