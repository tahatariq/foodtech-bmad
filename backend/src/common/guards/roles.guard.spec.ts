import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createContext(role?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as import('@nestjs/common').ExecutionContext;
  }

  it('should allow access when no @Roles() decorator is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext('line_cook'))).toBe(true);
  });

  it('should deny line_cook accessing admin-only endpoint', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(['system_admin']); // roles
    expect(() => guard.canActivate(createContext('line_cook'))).toThrow(
      ForbiddenException,
    );
  });

  it('should allow org_owner accessing location_manager endpoint (hierarchy)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(['location_manager']); // roles
    expect(guard.canActivate(createContext('org_owner'))).toBe(true);
  });

  it('should allow system_admin accessing any endpoint', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(['head_chef']); // roles
    expect(guard.canActivate(createContext('system_admin'))).toBe(true);
  });

  it('should allow on @Public() endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // isPublic
    expect(guard.canActivate(createContext())).toBe(true);
  });
});
