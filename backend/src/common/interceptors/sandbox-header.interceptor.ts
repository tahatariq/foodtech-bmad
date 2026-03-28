import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { locations } from '../../database/schema/locations.schema';

@Injectable()
export class SandboxHeaderInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const tenantId =
          (request as Request & { user?: { tenantId?: string } }).user
            ?.tenantId ?? (request.params as Record<string, string>).tenantId;

        if (!tenantId) return;

        void this.db
          .select({ is_sandbox: locations.is_sandbox })
          .from(locations)
          .where(eq(locations.id, tenantId))
          .then(([location]) => {
            if (location?.is_sandbox) {
              response.setHeader('X-FoodTech-Environment', 'sandbox');
            }
          })
          .catch(() => {
            // Silently ignore — don't break the response for a header
          });
      }),
    );
  }
}
