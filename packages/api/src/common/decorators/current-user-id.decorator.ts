import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // 1. Prioritize authenticated user from JWT
    if (request.user?.id) {
      return request.user.id;
    }
    // 2. Fall back to header for testing or guest identification
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id'] as string;
    }
    // 3. Default fallback
    return '00000000-0000-0000-0000-000000000001';
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  },
);
