import { Reflector } from '@nestjs/core';
import { TierGuard } from './tier.guard';
import { ForbiddenException } from '@nestjs/common';

describe('TierGuard', () => {
  let guard: TierGuard;
  let reflector: Partial<Reflector>;
  let mockDb: { select: jest.Mock };
  let mockContext: {
    getHandler: jest.Mock;
    getClass: jest.Mock;
    switchToHttp: jest.Mock;
  };

  function setupDb(tier: string | null) {
    const mockLimit = jest.fn().mockResolvedValue(
      tier ? [{ tier }] : [],
    );
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockInnerJoin = jest
      .fn()
      .mockReturnValue({ where: mockWhere });
    const mockFrom = jest
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoin });
    mockDb = {
      select: jest.fn().mockReturnValue({ from: mockFrom }),
    };
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    setupDb('indie');
    guard = new TierGuard(
      reflector as Reflector,
      mockDb as unknown as import('../../database/database.provider').DrizzleDB,
    );

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({
          user: { tenantId: 'loc-1', role: 'head_chef' },
        }),
      }),
    };
  });

  it('should allow when no @TierGated decorator is present', async () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(undefined); // tier

    const result = await guard.canActivate(
      mockContext as unknown as import('@nestjs/common').ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should allow when public endpoint', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(true);

    const result = await guard.canActivate(
      mockContext as unknown as import('@nestjs/common').ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should reject indie tier accessing growth feature', async () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('growth');

    await expect(
      guard.canActivate(
        mockContext as unknown as import('@nestjs/common').ExecutionContext,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow growth tier accessing growth feature', async () => {
    setupDb('growth');
    guard = new TierGuard(
      reflector as Reflector,
      mockDb as unknown as import('../../database/database.provider').DrizzleDB,
    );

    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('growth');

    const result = await guard.canActivate(
      mockContext as unknown as import('@nestjs/common').ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should allow enterprise tier accessing any feature', async () => {
    setupDb('enterprise');
    guard = new TierGuard(
      reflector as Reflector,
      mockDb as unknown as import('../../database/database.provider').DrizzleDB,
    );

    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('growth');

    const result = await guard.canActivate(
      mockContext as unknown as import('@nestjs/common').ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should include RFC 7807 type in error', async () => {
    (reflector.getAllAndOverride as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce('growth');

    try {
      await guard.canActivate(
        mockContext as unknown as import('@nestjs/common').ExecutionContext,
      );
      fail('Expected ForbiddenException');
    } catch (e) {
      const response = (e as ForbiddenException).getResponse() as Record<
        string,
        unknown
      >;
      expect(response.type).toBe(
        'https://foodtech.app/errors/tier-restricted',
      );
      expect(response.detail).toContain('growth');
      expect(response.detail).toContain('indie');
    }
  });
});
