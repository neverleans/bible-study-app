import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../database/database.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './services/gemini.service';
import { AiAnalysisProcessor } from './processors/ai-analysis.processor';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService, AiAnalysisProcessor],
  exports: [AiService],
})
export class AiModule {}
