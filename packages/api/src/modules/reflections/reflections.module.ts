import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReflectionsController } from './reflections.controller';
import { ReflectionsService } from './reflections.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: 'ai-analysis' })],
  controllers: [ReflectionsController],
  providers: [ReflectionsService],
})
export class ReflectionsModule {}
