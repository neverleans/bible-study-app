import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('BibleController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/bible/books (GET) should return 66 books', async () => {
    const res = await request(app.getHttpServer())
      .get('/bible/books')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(66);
    expect(res.body[0].abbrev).toBe('gn');
    expect(res.body[0].name).toBe('Gênesis');
  });

  it('/api/bible/books?testament=NT (GET) should return 27 books', async () => {
    const res = await request(app.getHttpServer())
      .get('/bible/books?testament=NT')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(27);
    expect(res.body[0].abbrev).toBe('mt');
  });

  it('/api/bible/books/gn (GET) should return Genesis book details', async () => {
    const res = await request(app.getHttpServer())
      .get('/bible/books/gn')
      .expect(200);

    expect(res.body.name).toBe('Gênesis');
    expect(res.body.chapterCount).toBe(50);
  });

  it('/api/bible/books/gn/chapters/1 (GET) should return Genesis chapter 1 verses', async () => {
    const res = await request(app.getHttpServer())
      .get('/bible/books/gn/chapters/1')
      .expect(200);

    expect(res.body.book.name).toBe('Gênesis');
    expect(res.body.number).toBe(1);
    expect(Array.isArray(res.body.verses)).toBe(true);
    expect(res.body.verses.length).toBeGreaterThan(0);
    expect(res.body.verses[0].number).toBe(1);
    expect(res.body.verses[0].text).toContain('No princípio');
    expect(res.body.prevChapter).toBeNull();
    expect(res.body.nextChapter).toEqual({ bookAbbrev: 'gn', chapterNumber: 2 });
  });

  it('/api/bible/books/xyz (GET) should return 404 for non-existent book', async () => {
    await request(app.getHttpServer())
      .get('/bible/books/xyz')
      .expect(404);
  });
});
