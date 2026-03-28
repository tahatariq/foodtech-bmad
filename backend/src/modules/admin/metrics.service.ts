import { Inject, Injectable } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { locations } from '../../database/schema/locations.schema';
import { organizations } from '../../database/schema/organizations.schema';
import { orders } from '../../database/schema/orders.schema';
import { staff } from '../../database/schema/staff.schema';

export interface AdoptionMetric {
  tenantId: string;
  tenantName: string;
  bumpUsageRate: number;
  activeUsersPerDay: number;
  daysSinceOnboarding: number;
  flagged: boolean;
}

@Injectable()
export class MetricsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getAdoptionMetrics(): Promise<AdoptionMetric[]> {
    // Get all active locations with their org info
    const allLocations = await this.db
      .select({
        locationId: locations.id,
        locationName: locations.name,
        orgName: organizations.name,
        createdAt: locations.created_at,
      })
      .from(locations)
      .innerJoin(organizations, eq(locations.organization_id, organizations.id))
      .where(eq(locations.is_active, true));

    const metrics: AdoptionMetric[] = [];

    for (const loc of allLocations) {
      // Total orders for this location
      const [orderCountResult] = await this.db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.tenant_id, loc.locationId));
      const totalOrders = orderCountResult?.value ?? 0;

      // Completed orders for this location
      const [completedResult] = await this.db
        .select({ value: count() })
        .from(orders)
        .where(
          and(
            eq(orders.tenant_id, loc.locationId),
            eq(orders.status, 'completed'),
          ),
        );
      const completedOrders = completedResult?.value ?? 0;

      // Bump usage rate: completed / total (simplified metric)
      const bumpUsageRate =
        totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      // Active staff count (simplified: distinct active staff)
      const [staffResult] = await this.db
        .select({ value: count() })
        .from(staff)
        .where(
          and(eq(staff.tenant_id, loc.locationId), eq(staff.is_active, true)),
        );
      const activeUsersPerDay = staffResult?.value ?? 0;

      // Days since onboarding
      const now = new Date();
      const created = new Date(loc.createdAt);
      const daysSinceOnboarding = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Flag if low usage after 3 days
      const flagged = bumpUsageRate < 50 && daysSinceOnboarding > 3;

      metrics.push({
        tenantId: loc.locationId,
        tenantName: `${loc.orgName} - ${loc.locationName}`,
        bumpUsageRate,
        activeUsersPerDay,
        daysSinceOnboarding,
        flagged,
      });
    }

    return metrics;
  }
}
