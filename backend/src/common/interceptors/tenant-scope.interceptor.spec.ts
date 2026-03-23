import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { TenantScopeInterceptor } from './tenant-scope.interceptor';
import { TenantContextService } from '../services/tenant-context.service';

describe('TenantScopeInterceptor', () => {
  let interceptor: TenantScopeInterceptor;
  let reflector: Reflector;
  let tenantContext: TenantContextService;

  beforeEach(() => {
    reflector = new Reflector();
    tenantContext = new TenantContextService();
    interceptor = new TenantScopeInterceptor(reflector, tenantContext);
  });

  function createMockContext(user?: { tenantId?: string }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  const mockCallHandler = {
    handle: () => of({ data: 'test' }),
  };

  it('should pass through when route is not tenant-scoped', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext();
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: 'test' });
      },
      complete: done,
    });
  });

  it('should throw ForbiddenException when tenant-scoped and no tenant in JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockContext({ tenantId: undefined });
    expect(() => interceptor.intercept(context, mockCallHandler)).toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when tenant-scoped and no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockContext(undefined);
    expect(() => interceptor.intercept(context, mockCallHandler)).toThrow(
      ForbiddenException,
    );
  });

  it('should set tenant context with correct tenantId when tenant-scoped with valid JWT', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const runSpy = jest.spyOn(tenantContext, 'run');

    const context = createMockContext({ tenantId: 'tenant-abc' });
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: 'test' });
        expect(runSpy).toHaveBeenCalledWith('tenant-abc', expect.any(Function));
      },
      complete: done,
    });
  });
});
