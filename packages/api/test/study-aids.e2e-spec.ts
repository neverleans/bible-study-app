import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('StudyAidsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/study-aids/book/gn (GET) should return study aids for Genesis', async () => {
    const res = await request(app.getHttpServer())
      .get('/study-aids/book/gn')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].bookAbbrev).toBe('gn');
    expect(res.body[0].bookName).toBe('Gênesis');
  });

  it('/study-aids/book/gn?type=context (GET) should filter by type', async () => {
    const res = await request(app.getHttpServer())
      .get('/study-aids/book/gn?type=context')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    for (const item of res.body) {
      expect(item.type).toBe('context');
    }
  });

  it('/study-aids/chapter/gn/1 (GET) should return aids for chapter 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/study-aids/chapter/gn/1')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    for (const item of res.body) {
      expect(item.metadata.chapterNumber).toBe(1);
    }
  });

  it('/study-aids/book/inexistente (GET) should return 404', async () => {
    await request(app.getHttpServer())
      .get('/study-aids/book/inexistente')
      .expect(404);
  });
});
