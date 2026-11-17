import { Module } from '@nestjs/common';
import { CompletionController } from './completion.controller';
import { CompletionService } from './completion.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CompletionController],
  providers: [CompletionService],
})
export class CompletionModule {}
