import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface WsUser {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

interface WsJwtPayload extends WsUser {
  type: string;
}

export function createWsAuthMiddleware(
  jwtService: JwtService,
  jwtSecret: string,
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const token = (socket.handshake.auth as Record<string, unknown>)?.token as
      | string
      | undefined;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const payload: WsJwtPayload = jwtService.verify(token, {
        secret: jwtSecret,
      });
      if (payload.type !== 'access') {
        return next(new Error('Unauthorized'));
      }
      (socket.data as { user: WsUser }).user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
      };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  };
}
