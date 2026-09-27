import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BibleService } from './bible.service';
import { DRIZZLE } from '../../database/database.module';

describe('BibleService', () => {
  let service: BibleService;

  const mockDb = {
    select: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BibleService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<BibleService>(BibleService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBooks', () => {
    it('should return books sorted by order', async () => {
      const mockBooks = [
        { id: 1, abbrev: 'gn', name: 'Gênesis', testament: 'OT', chapterCount: 50, order: 1 },
      ];
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockBooks),
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await service.getBooks();
      expect(result).toEqual(mockBooks);
    });

    it('should filter by testament when provided', async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await service.getBooks('nt');
      expect(result).toEqual([]);
      expect(mockQuery.where).toHaveBeenCalled();
    });
  });

  describe('getBookByAbbrev', () => {
    it('should return a book by abbrev', async () => {
      const mockBook = { id: 1, abbrev: 'gn', name: 'Gênesis', testament: 'OT', chapterCount: 50, order: 1 };
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBook]),
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await service.getBookByAbbrev('gn');
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException if book does not exist', async () => {
      const mockQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockQuery);

      await expect(service.getBookByAbbrev('xyz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChapter', () => {
    it('should return chapter verses and navigation links', async () => {
      const mockBook = { id: 1, abbrev: 'gn', name: 'Gênesis', testament: 'OT', chapterCount: 50, order: 1 };
      const mockChapter = { id: 1, bookId: 1, number: 2, verses: ['Verso 1', 'Verso 2'] };

      const bookQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockBook]),
      };
      const chapterQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockChapter]),
      };

      mockDb.select
        .mockReturnValueOnce(bookQuery)
        .mockReturnValueOnce(chapterQuery);

      const result = await service.getChapter('gn', 2);
      expect(result.book).toEqual(mockBook);
      expect(result.number).toBe(2);
      expect(result.verses).toEqual([
        { number: 1, text: 'Verso 1' },
        { number: 2, text: 'Verso 2' },
      ]);
      expect(result.prevChapter).toEqual({ bookAbbrev: 'gn', chapterNumber: 1 });
      expect(result.nextChapter).toEqual({ bookAbbrev: 'gn', chapterNumber: 3 });
    });
  });
});
