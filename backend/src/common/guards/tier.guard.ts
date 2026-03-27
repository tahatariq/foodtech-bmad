import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { eq } from 'drizzle-orm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TIER_KEY } from '../decorators/tier-gated.decorator';
import {
  type SubscriptionTierType,
  meetsMinimumTier,
} from '../constants/tiers';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { locations } from '../../database/schema/locations.schema';
import { organizations } from '../../database/schema/organizations.schema';

@Injectable()
export class TierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredTier =
      this.reflector.getAllAndOverride<SubscriptionTierType>(TIER_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredTier) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;
    const tenantId = user?.tenantId as string | undefined;

    if (!tenantId) {
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: 'Unable to determine organization tier.',
      });
    }

    const currentTier = await this.getOrganizationTier(tenantId);

    if (!meetsMinimumTier(currentTier, requiredTier)) {
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: `This feature requires the ${requiredTier} plan. Your organization is on the ${currentTier} plan. Visit https://foodtech.app/upgrade to upgrade.`,
      });
    }

    return true;
  }

  private async getOrganizationTier(
    tenantId: string,
  ): Promise<SubscriptionTierType> {
    const result = await this.db
      .select({ tier: organizations.subscription_tier })
      .from(locations)
      .innerJoin(organizations, eq(locations.organization_id, organizations.id))
      .where(eq(locations.id, tenantId))
      .limit(1);

    if (!result[0]) {
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: 'Organization not found.',
      });
    }

    return result[0].tier as SubscriptionTierType;
  }
}
