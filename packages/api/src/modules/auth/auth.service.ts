import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/schema';
import { users } from '../../database/schema/users';
import { DRIZZLE } from '../../database/database.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'biblia-dev-secret-key-super-secure';
    this.jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if email already registered
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name: dto.name?.trim() || null,
        provider: 'local',
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        provider: users.provider,
        createdAt: users.createdAt,
      });

    const tokens = await this.generateTokens(newUser.id, newUser.email);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        provider: newUser.provider,
        createdAt: newUser.createdAt.toISOString(),
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        createdAt: user.createdAt.toISOString(),
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtSecret,
      });

      const [user] = await this.db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.jwtSecret,
          expiresIn: this.jwtExpiresIn,
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido.');
    }
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        provider: users.provider,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtRefreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
