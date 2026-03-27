import { Inject, Injectable } from '@nestjs/common';
import { eq, and, count } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { organizations } from '../../database/schema/organizations.schema';
import { locations } from '../../database/schema/locations.schema';
import { staff } from '../../database/schema/staff.schema';

@Injectable()
export class TenantsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findOrganizationById(orgId: string) {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    return result[0] ?? null;
  }

  async findLocationById(locationId: string) {
    const result = await this.db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);
    return result[0] ?? null;
  }

  async getOrganizationTierByLocationId(locationId: string) {
    const result = await this.db
      .select({
        tier: organizations.subscription_tier,
        organizationId: organizations.id,
      })
      .from(locations)
      .innerJoin(organizations, eq(locations.organization_id, organizations.id))
      .where(eq(locations.id, locationId))
      .limit(1);
    return result[0] ?? null;
  }

  async countActiveLocationsByOrg(orgId: string): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(locations)
      .where(
        and(eq(locations.organization_id, orgId), eq(locations.is_active, true)),
      );
    return result[0]?.value ?? 0;
  }

  async countActiveStaffByLocation(tenantId: string): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(staff)
      .where(and(eq(staff.tenant_id, tenantId), eq(staff.is_active, true)));
    return result[0]?.value ?? 0;
  }
}
