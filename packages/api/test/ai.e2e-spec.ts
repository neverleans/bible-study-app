import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AiController (e2e)', () => {
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

  it('/ai/chapter (POST) should request chapter analysis and return queued or completed', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai/chapter')
      .send({
        bookAbbrev: 'gn',
        chapterNumber: 1,
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(['completed', 'queued', 'active', 'waiting']).toContain(res.body.status);
    if (res.body.status === 'queued') {
      expect(res.body.jobId).toBeDefined();
    } else if (res.body.status === 'completed') {
      expect(res.body.data).toBeDefined();
      expect(res.body.data.bookName).toBe('Gênesis');
    }
  });

  it('/ai/chapter (POST) should return 404 for nonexistent book', async () => {
    await request(app.getHttpServer())
      .post('/ai/chapter')
      .send({
        bookAbbrev: 'livro_inexistente',
        chapterNumber: 1,
      })
      .expect(404);
  });

  it('/ai/book (POST) should request book reflection and return queued or completed', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai/book')
      .send({
        bookAbbrev: 'gn',
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(['completed', 'queued', 'active', 'waiting']).toContain(res.body.status);
  });

  it('/ai/status/:jobId (GET) should return job status', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai/status/chapter-1-1')
      .expect(200);

    expect(res.body).toBeDefined();
    expect(['completed', 'queued', 'active', 'waiting', 'failed']).toContain(res.body.status);
  });
});
