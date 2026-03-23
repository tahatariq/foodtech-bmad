import { JwtService } from '@nestjs/jwt';
import { createWsAuthMiddleware } from './ws-auth.middleware';

describe('WsAuthMiddleware', () => {
  let jwtService: Partial<JwtService>;
  let middleware: ReturnType<typeof createWsAuthMiddleware>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };
    middleware = createWsAuthMiddleware(
      jwtService as JwtService,
      'test-secret',
    );
  });

  function createSocket(token?: string) {
    return {
      handshake: {
        auth: token ? { token } : {},
      },
      data: {},
    } as unknown as import('socket.io').Socket;
  }

  it('should accept valid JWT and attach user data', () => {
    (jwtService.verify as jest.Mock).mockReturnValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'head_chef',
      email: 'chef@test.com',
      type: 'access',
    });

    const next = jest.fn();
    middleware(createSocket('valid-token'), next);

    expect(next).toHaveBeenCalledWith();
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
  });

  it('should reject missing token', () => {
    const next = jest.fn();
    middleware(createSocket(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(((next.mock.calls[0] as unknown[])[0] as Error).message).toBe(
      'Unauthorized',
    );
  });

  it('should reject invalid JWT', () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const next = jest.fn();
    middleware(createSocket('invalid-token'), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject non-access token type', () => {
    (jwtService.verify as jest.Mock).mockReturnValue({
      userId: 'user-1',
      type: 'refresh',
    });

    const next = jest.fn();
    middleware(createSocket('refresh-token'), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
