import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { BibleModule } from './modules/bible/bible.module';
import { SearchModule } from './modules/search/search.module';
import { NotesModule } from './modules/notes/notes.module';
import { HighlightsModule } from './modules/highlights/highlights.module';
import { ProgressModule } from './modules/progress/progress.module';
import { OriginalModule } from './modules/original/original.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ReviewModule } from './modules/review/review.module';
import { AiModule } from './modules/ai/ai.module';
import { StudyAidsModule } from './modules/study-aids/study-aids.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    HealthModule,
    BibleModule,
    SearchModule,
    NotesModule,
    HighlightsModule,
    ProgressModule,
    OriginalModule,
    QuizModule,
    ReviewModule,
    AiModule,
    StudyAidsModule,
    AuthModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60000,
          limit: config.get('NODE_ENV') === 'test' ? 10000 : 120,
        },
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
