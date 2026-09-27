import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { DRIZZLE } from '../../database/database.module';

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verifyAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully and return tokens', async () => {
      // Mock existing email check (not found)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const mockDate = new Date();
      // Mock insert user
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([
            {
              id: '123-uuid',
              email: 'novo@teste.com',
              name: 'Novo Usuário',
              provider: 'local',
              createdAt: mockDate,
            },
          ]),
        }),
      });

      const result = await service.register({
        email: 'novo@teste.com',
        password: 'Password123!',
        name: 'Novo Usuário',
      });

      expect(result.user.email).toBe('novo@teste.com');
      expect(result.user.id).toBe('123-uuid');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([{ id: 'existing-id' }]),
          }),
        }),
      });

      await expect(
        service.register({
          email: 'existente@teste.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens when credentials are valid', async () => {
      const mockDate = new Date();
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([
              {
                id: '123-uuid',
                email: 'usuario@teste.com',
                passwordHash: hashedPassword,
                name: 'Usuário Teste',
                provider: 'local',
                createdAt: mockDate,
              },
            ]),
          }),
        }),
      });

      const result = await service.login({
        email: 'usuario@teste.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('usuario@teste.com');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('OtherPassword', 10);

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([
              {
                id: '123-uuid',
                email: 'usuario@teste.com',
                passwordHash: hashedPassword,
              },
            ]),
          }),
        }),
      });

      await expect(
        service.login({
          email: 'usuario@teste.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
