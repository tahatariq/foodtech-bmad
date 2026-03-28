import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, count, ne } from 'drizzle-orm';
import { Roles, SkipTenantCheck } from '../../common/decorators';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { locations } from '../../database/schema/locations.schema';
import { organizations } from '../../database/schema/organizations.schema';
import { orders } from '../../database/schema/orders.schema';
import { staff } from '../../database/schema/staff.schema';
import {
  type SubscriptionTierType,
  DEFAULT_TIER_LIMITS,
  getNextTier,
} from '../../common/constants/tiers';

export type TempoStatus = 'green' | 'amber' | 'red';

export interface LocationSummary {
  id: string;
  name: string;
  activeOrderCount: number;
  tempoStatus: TempoStatus;
  staffCount: number;
}

export interface OrgAnalytics {
  totalOrders: number;
  avgTicketTime: number;
  locationBreakdown: {
    locationId: string;
    locationName: string;
    orderCount: number;
  }[];
}

@Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get(':orgId/locations')
  @Roles('org_owner', 'system_admin')
  @SkipTenantCheck()
  async getLocations(
    @Param('orgId') orgId: string,
  ): Promise<LocationSummary[]> {
    const orgLocations = await this.db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.organization_id, orgId),
          eq(locations.is_active, true),
        ),
      );

    const summaries: LocationSummary[] = [];

    for (const loc of orgLocations) {
      // Count active orders (not completed or cancelled)
      const [orderResult] = await this.db
        .select({ value: count() })
        .from(orders)
        .where(
          and(eq(orders.tenant_id, loc.id), ne(orders.status, 'completed')),
        );

      // Count active staff
      const [staffResult] = await this.db
        .select({ value: count() })
        .from(staff)
        .where(and(eq(staff.tenant_id, loc.id), eq(staff.is_active, true)));

      summaries.push({
        id: loc.id,
        name: loc.name,
        activeOrderCount: orderResult?.value ?? 0,
        tempoStatus: 'green' as TempoStatus, // placeholder
        staffCount: staffResult?.value ?? 0,
      });
    }

    return summaries;
  }

  @Get(':orgId/analytics')
  @Roles('org_owner', 'system_admin')
  @SkipTenantCheck()
  async getAnalytics(@Param('orgId') orgId: string): Promise<OrgAnalytics> {
    const orgLocations = await this.db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(
        and(
          eq(locations.organization_id, orgId),
          eq(locations.is_active, true),
        ),
      );

    let totalOrders = 0;
    const locationBreakdown: OrgAnalytics['locationBreakdown'] = [];

    for (const loc of orgLocations) {
      const [orderResult] = await this.db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.tenant_id, loc.id));

      const orderCount = orderResult?.value ?? 0;
      totalOrders += orderCount;

      locationBreakdown.push({
        locationId: loc.id,
        locationName: loc.name,
        orderCount,
      });
    }

    return {
      totalOrders,
      avgTicketTime: 0, // placeholder - would need timestamp calculations
      locationBreakdown,
    };
  }

  @Post(':orgId/locations')
  @Roles('org_owner', 'system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.CREATED)
  async addLocation(
    @Param('orgId') orgId: string,
    @Body() body: { name: string; address?: string; timezone?: string },
  ) {
    // Look up org and tier
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      throw new ForbiddenException({
        type: 'tier-limit-exceeded',
        title: 'Organization Not Found',
        status: 403,
        detail: 'Organization not found.',
      });
    }

    const tier = org.subscription_tier as SubscriptionTierType;
    const limits = DEFAULT_TIER_LIMITS[tier];

    // Check tier limits (maxLocations of -1 means unlimited)
    if (limits.maxLocations !== -1) {
      const [countResult] = await this.db
        .select({ value: count() })
        .from(locations)
        .where(
          and(
            eq(locations.organization_id, orgId),
            eq(locations.is_active, true),
          ),
        );

      const currentCount = countResult?.value ?? 0;

      if (currentCount >= limits.maxLocations) {
        const nextTier = getNextTier(tier);
        throw new ForbiddenException({
          type: 'tier-limit-exceeded',
          title: 'Tier Limit Exceeded',
          status: 403,
          detail: `Your ${tier} plan allows a maximum of ${limits.maxLocations} location(s). You currently have ${currentCount}.${nextTier ? ` Upgrade to ${nextTier} for more locations.` : ''}`,
        });
      }
    }

    const [location] = await this.db
      .insert(locations)
      .values({
        organization_id: orgId,
        name: body.name,
        address: body.address ?? null,
        timezone: body.timezone ?? 'UTC',
      })
      .returning();

    return location;
  }
}
