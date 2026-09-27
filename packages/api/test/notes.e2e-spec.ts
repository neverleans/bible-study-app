import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('NotesController (e2e - PostgreSQL Row-Level Security)', () => {
  let app: INestApplication;
  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';
  let createdNoteId: string;

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

  it('User A should create a private note on Gênesis 1:1', async () => {
    const res = await request(app.getHttpServer())
      .post('/notes')
      .set('x-user-id', userA)
      .send({
        bookAbbrev: 'gn',
        chapterNumber: 1,
        verseNumber: 1,
        content: 'Reflexão privada do Usuário A',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.bookName).toBe('Gênesis');
    expect(res.body.content).toBe('Reflexão privada do Usuário A');
    createdNoteId = res.body.id;
  });

  it('User A should be able to read their own note', async () => {
    const res = await request(app.getHttpServer())
      .get('/notes?book=gn&chapter=1')
      .set('x-user-id', userA)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((n: any) => n.id === createdNoteId)).toBe(true);
  });

  it('User B should NOT see User A note (Strict RLS Isolation)', async () => {
    const res = await request(app.getHttpServer())
      .get('/notes?book=gn&chapter=1')
      .set('x-user-id', userB)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((n: any) => n.id === createdNoteId)).toBe(false);
  });

  it('User B should NOT be able to update User A note (RLS blocks update)', async () => {
    await request(app.getHttpServer())
      .put(`/notes/${createdNoteId}`)
      .set('x-user-id', userB)
      .send({ content: 'Tentativa de alteração maliciosa' })
      .expect(404);
  });

  it('User B should NOT be able to delete User A note (RLS blocks delete)', async () => {
    await request(app.getHttpServer())
      .delete(`/notes/${createdNoteId}`)
      .set('x-user-id', userB)
      .expect(404);
  });

  it('User A should be able to update their own note', async () => {
    const res = await request(app.getHttpServer())
      .put(`/notes/${createdNoteId}`)
      .set('x-user-id', userA)
      .send({ content: 'Reflexão atualizada com sucesso' })
      .expect(200);

    expect(res.body.content).toBe('Reflexão atualizada com sucesso');
  });

  it('User A should be able to delete their own note', async () => {
    await request(app.getHttpServer())
      .delete(`/notes/${createdNoteId}`)
      .set('x-user-id', userA)
      .expect(200);
  });
});
