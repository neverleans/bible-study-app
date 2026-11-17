import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GuestClaimService } from './guest-claim.service';
import { ClaimGuestDto, ClaimGuestResultDto } from './dto/guest-claim.dto';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('guest')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guest')
export class GuestClaimController {
  constructor(private readonly guestClaimService: GuestClaimService) {}

  @Post('claim')
  @HttpCode(200)
  @ApiOperation({ summary: 'Traz para a conta o que a pessoa fez como visitante (quiz, explicações e cartões)' })
  @ApiResponse({ status: 200, type: ClaimGuestResultDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  claim(@CurrentUserId() userId: string, @Body() dto: ClaimGuestDto): Promise<ClaimGuestResultDto> {
    return this.guestClaimService.claim(userId, dto.guestId);
  }
}
