import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    // If error or no user, proceed without user (guest mode)
    if (err || !user) {
      return undefined as unknown as TUser;
    }
    return user;
  }
}
