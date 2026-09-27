import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StudyAidsController } from './study-aids.controller';
import { StudyAidsService } from './study-aids.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StudyAidsController],
  providers: [StudyAidsService],
  exports: [StudyAidsService],
})
export class StudyAidsModule {}
