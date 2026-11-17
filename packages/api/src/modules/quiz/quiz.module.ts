import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: 'ai-analysis' })],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
