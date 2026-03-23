import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { TENANT_SCOPED_KEY } from '../decorators/tenant-scoped.decorator';
import { TenantContextService } from '../services/tenant-context.service';

@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isTenantScoped = this.reflector.getAllAndOverride<boolean>(
      TENANT_SCOPED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isTenantScoped) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.tenantId) {
      throw new ForbiddenException(
        'Tenant context required but not found in JWT',
      );
    }

    return new Observable((subscriber) => {
      this.tenantContext.run(user.tenantId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
