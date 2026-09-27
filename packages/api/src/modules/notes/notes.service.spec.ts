import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { DRIZZLE } from '../../database/database.module';

describe('NotesService', () => {
  let service: NotesService;

  const mockTx = {
    execute: jest.fn().mockResolvedValue([]),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDb = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotes', () => {
    it('should set session user context and return notes', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          userId: 'user-1',
          bookAbbrev: 'gn',
          bookName: 'Gênesis',
          chapterNumber: 1,
          verseNumber: 1,
          content: 'Nota de teste',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const query = {
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockNotes),
      };
      mockTx.select.mockReturnValue(query);

      const result = await service.getNotes('user-1');
      expect(mockTx.execute).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('note-1');
    });
  });

  describe('createNote', () => {
    it('should create a note for a book', async () => {
      // Mock select book
      const bookQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 1, abbrev: 'gn', name: 'Gênesis' }]),
      };
      // Mock insert user
      const userInsert = {
        values: jest.fn().mockReturnThis(),
        onConflictDoNothing: jest.fn().mockResolvedValue([]),
      };
      // Mock insert note
      const noteInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: 'note-123',
            userId: 'user-1',
            chapterNumber: 1,
            verseNumber: 1,
            content: 'Minha nota',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      mockTx.select.mockReturnValue(bookQuery);
      mockTx.insert
        .mockReturnValueOnce(userInsert)
        .mockReturnValueOnce(noteInsert);

      const result = await service.createNote('user-1', {
        bookAbbrev: 'gn',
        chapterNumber: 1,
        verseNumber: 1,
        content: 'Minha nota',
      });

      expect(mockTx.execute).toHaveBeenCalled();
      expect(result.id).toBe('note-123');
      expect(result.bookName).toBe('Gênesis');
    });
  });
});
