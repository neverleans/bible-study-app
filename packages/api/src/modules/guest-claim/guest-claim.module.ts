import { Module } from '@nestjs/common';
import { GuestClaimController } from './guest-claim.controller';
import { GuestClaimService } from './guest-claim.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GuestClaimController],
  providers: [GuestClaimService],
})
export class GuestClaimModule {}
