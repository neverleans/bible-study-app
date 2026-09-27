import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { BibleModule } from './modules/bible/bible.module';
import { SearchModule } from './modules/search/search.module';
import { NotesModule } from './modules/notes/notes.module';

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
})
export class AppModule {}
