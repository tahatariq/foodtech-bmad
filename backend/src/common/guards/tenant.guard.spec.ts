import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  function createContext(
    user?: { tenantId?: string; role?: string },
    params?: Record<string, string>,
  ) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: params ?? {},
          query: {},
          body: {},
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as import('@nestjs/common').ExecutionContext;
  }

  it('should allow matching tenant_id', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(
      guard.canActivate(
        createContext(
          { tenantId: 'tenant-1', role: 'head_chef' },
          { tenantId: 'tenant-1' },
        ),
      ),
    ).toBe(true);
  });

  it('should deny mismatched tenant_id', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(() =>
      guard.canActivate(
        createContext(
          { tenantId: 'tenant-1', role: 'head_chef' },
          { tenantId: 'tenant-2' },
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('should allow system_admin to access any tenant', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(
      guard.canActivate(
        createContext(
          { tenantId: 'tenant-1', role: 'system_admin' },
          { tenantId: 'tenant-2' },
        ),
      ),
    ).toBe(true);
  });

  it('should skip check with @SkipTenantCheck()', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(true); // skipTenantCheck
    expect(
      guard.canActivate(
        createContext(
          { tenantId: 'tenant-1', role: 'head_chef' },
          { tenantId: 'tenant-2' },
        ),
      ),
    ).toBe(true);
  });

  it('should allow when no tenant_id in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(
      guard.canActivate(
        createContext({ tenantId: 'tenant-1', role: 'head_chef' }),
      ),
    ).toBe(true);
  });
});
