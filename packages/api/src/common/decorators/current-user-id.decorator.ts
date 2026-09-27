import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      (request.headers['x-user-id'] as string) ||
      '00000000-0000-0000-0000-000000000001'
    );
  },
);
