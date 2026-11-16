import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OriginalService, strongCandidates } from './original.service';
import { DRIZZLE } from '../../database/database.module';

describe('strongCandidates', () => {
  it('tries exact key, bare number and main-sense suffix, without duplicates', () => {
    expect(strongCandidates('H1697H')).toEqual(['H1697H', 'H1697', 'H1697G']);
    expect(strongCandidates('G0746')).toEqual(['G0746', 'G0746G']);
  });
});

describe('OriginalService', () => {
  let service: OriginalService;
  const mockDb = { select: jest.fn() };

  const bookQuery = (rows: unknown[]) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OriginalService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(OriginalService);
    jest.clearAllMocks();
  });

  it('groups words by verse in order', async () => {
    const word = (verseNumber: number, position: number, surface: string) => ({
      verseNumber, position, surface, lang: 'heb',
      transliteration: null, gloss: null, strong: 'H1961', morph: null, lemma: null,
    });
    mockDb.select
      .mockReturnValueOnce(bookQuery([{ id: 32, abbrev: 'jn' }]))
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([word(1, 1, 'א'), word(1, 2, 'ב'), word(2, 1, 'ג')]),
      });

    const result = await service.getChapter('JN', 1);

    expect(result.available).toBe(true);
    expect(result.lang).toBe('heb');
    expect(result.verses.map((v) => [v.verseNumber, v.words.length])).toEqual([[1, 2], [2, 1]]);
  });

  it('reports unavailable (not an error) when a book has no imported originals', async () => {
    mockDb.select.mockReturnValueOnce(bookQuery([{ id: 1, abbrev: 'gn' }])).mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getChapter('gn', 1)).resolves.toMatchObject({
      available: false,
      verses: [],
    });
  });

  it('throws NotFound for an unknown book', async () => {
    mockDb.select.mockReturnValueOnce(bookQuery([]));
    await expect(service.getChapter('zz', 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('falls back from a sub-meaning key to the main lexicon entry', async () => {
    const entry = { strong: 'H1697G', lang: 'heb', lemma: 'דָּבָר', transliteration: null, morph: null, gloss: 'word', meaning: null };
    mockDb.select.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([entry]),
    });

    await expect(service.getLexiconEntry('H1697H')).resolves.toEqual(entry);
  });

  it('throws NotFound when no candidate exists', async () => {
    mockDb.select.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    });
    await expect(service.getLexiconEntry('H9999')).rejects.toBeInstanceOf(NotFoundException);
  });
});
