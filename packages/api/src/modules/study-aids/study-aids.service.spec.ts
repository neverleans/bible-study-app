import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudyAidsService } from './study-aids.service';
import { DRIZZLE } from '../../database/database.module';

describe('StudyAidsService', () => {
  let service: StudyAidsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyAidsService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<StudyAidsService>(StudyAidsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudyAidsByBook', () => {
    it('should return study aids for a valid book', async () => {
      const mockDate = new Date();
      // Mock findBook
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([{ id: 1, name: 'Gênesis', abbrev: 'gn' }]),
            }),
          }),
        })
        // Mock query study aids
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            innerJoin: jest.fn().mockReturnValueOnce({
              where: jest.fn().mockReturnValueOnce({
                orderBy: jest.fn().mockResolvedValueOnce([
                  {
                    id: 1,
                    bookId: 1,
                    bookAbbrev: 'gn',
                    bookName: 'Gênesis',
                    type: 'context',
                    content: 'Contexto de Gênesis',
                    metadata: { author: 'Moisés' },
                    createdAt: mockDate,
                  },
                ]),
              }),
            }),
          }),
        });

      const result = await service.getStudyAidsByBook('gn');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('context');
      expect(result[0].bookAbbrev).toBe('gn');
      expect(result[0].metadata).toEqual({ author: 'Moisés' });
      expect(result[0].createdAt).toBe(mockDate.toISOString());
    });

    it('should throw NotFoundException if book does not exist', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      await expect(service.getStudyAidsByBook('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudyAidsByChapter', () => {
    it('should return study aids for a specific chapter', async () => {
      const mockDate = new Date();
      // Mock findBook
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            where: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockResolvedValueOnce([{ id: 1, name: 'Gênesis', abbrev: 'gn' }]),
            }),
          }),
        })
        // Mock query chapter study aids
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValueOnce({
            innerJoin: jest.fn().mockReturnValueOnce({
              where: jest.fn().mockReturnValueOnce({
                orderBy: jest.fn().mockResolvedValueOnce([
                  {
                    id: 2,
                    bookId: 1,
                    bookAbbrev: 'gn',
                    bookName: 'Gênesis',
                    type: 'summary',
                    content: 'Resumo do cap 1',
                    metadata: { chapterNumber: 1 },
                    createdAt: mockDate,
                  },
                ]),
              }),
            }),
          }),
        });

      const result = await service.getStudyAidsByChapter('gn', 1);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('summary');
      expect(result[0].metadata).toEqual({ chapterNumber: 1 });
    });
  });
});
