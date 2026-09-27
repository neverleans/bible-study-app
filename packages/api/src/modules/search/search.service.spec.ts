import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { DRIZZLE } from '../../database/database.module';

describe('SearchService', () => {
  let service: SearchService;

  const mockDb = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty results when count is 0', async () => {
    mockDb.execute.mockResolvedValueOnce([{ count: 0 }]);

    const result = await service.search({ q: 'inexistente' });
    expect(result.total).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.totalPages).toBe(0);
  });

  it('should return ranked and highlighted search results', async () => {
    mockDb.execute
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([
        {
          verseId: 1,
          bookName: 'Gênesis',
          bookAbbrev: 'gn',
          testament: 'OT',
          chapterNumber: 1,
          verseNumber: 1,
          text: 'No princípio criou Deus os céus e a terra.',
          highlight: 'No princípio criou <mark>Deus</mark> os céus e a terra.',
        },
      ]);

    const result = await service.search({ q: 'Deus', page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.results.length).toBe(1);
    expect(result.results[0].bookName).toBe('Gênesis');
    expect(result.results[0].highlight).toContain('<mark>Deus</mark>');
  });
});
