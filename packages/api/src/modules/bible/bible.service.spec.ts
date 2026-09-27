import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BibleService } from './bible.service';
import { PrismaService } from '../../database/prisma.service';

describe('BibleService', () => {
  let service: BibleService;

  const mockPrisma = {
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BibleService,
        { provide: PrismaService, useValue: mockPrisma },
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
      mockPrisma.book.findMany.mockResolvedValue(mockBooks);

      const result = await service.getBooks();
      expect(result).toEqual(mockBooks);
      expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { order: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should filter by testament when provided', async () => {
      mockPrisma.book.findMany.mockResolvedValue([]);

      await service.getBooks('nt');
      expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
        where: { testament: 'NT' },
        orderBy: { order: 'asc' },
        select: expect.any(Object),
      });
    });
  });

  describe('getBookByAbbrev', () => {
    it('should return a book by abbrev', async () => {
      const mockBook = { id: 1, abbrev: 'gn', name: 'Gênesis', testament: 'OT', chapterCount: 50, order: 1 };
      mockPrisma.book.findUnique.mockResolvedValue(mockBook);

      const result = await service.getBookByAbbrev('gn');
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException if book does not exist', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(null);

      await expect(service.getBookByAbbrev('xyz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChapter', () => {
    it('should return chapter verses and navigation links', async () => {
      const mockBook = { id: 1, abbrev: 'gn', name: 'Gênesis', testament: 'OT', chapterCount: 50, order: 1 };
      const mockChapter = { id: 1, bookId: 1, number: 2, verses: ['Verso 1', 'Verso 2'] };

      mockPrisma.book.findUnique.mockResolvedValue(mockBook);
      mockPrisma.chapter.findUnique.mockResolvedValue(mockChapter);

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
