import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_TENANT_CHECK_KEY } from '../decorators/skip-tenant-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { StaffRole } from '../constants/roles';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTenantCheck) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user) return true; // No user means AuthGuard hasn't run or @Public()

    // system_admin bypasses tenant check
    if (user.role === StaffRole.SYSTEM_ADMIN) return true;

    const requestedTenantId =
      (request.params as Record<string, unknown>)?.tenantId ??
      (request.query as Record<string, unknown>)?.tenantId ??
      (request.body as Record<string, unknown>)?.tenantId;

    // If no tenant context in request, allow (endpoint may not be tenant-scoped)
    if (!requestedTenantId) return true;

    if (user.tenantId !== requestedTenantId) {
      throw new ForbiddenException("Access denied to this tenant's resources");
    }

    return true;
  }
}
