import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { organizations } from '../../database/schema/organizations.schema';
import { locations } from '../../database/schema/locations.schema';
import { stations } from '../../database/schema/stations.schema';
import { orderStages } from '../../database/schema/orders.schema';
import type { CreateTenantDto } from './dto/create-tenant.dto';
import type { ActivateTenantDto } from './dto/activate-tenant.dto';

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createTenant(dto: CreateTenantDto) {
    return this.db.transaction(async (tx) => {
      const slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const [org] = await tx
        .insert(organizations)
        .values({
          name: dto.name,
          slug: `${slug}-${Date.now()}`,
          subscription_tier: dto.tier,
        })
        .returning();

      const [location] = await tx
        .insert(locations)
        .values({
          organization_id: org.id,
          name: `${dto.name} - Main`,
        })
        .returning();

      return { tenantId: location.id, orgId: org.id };
    });
  }

  async activateTenant(tenantId: string, dto: ActivateTenantDto) {
    return this.db.transaction(async (tx) => {
      const createdStations = await tx
        .insert(stations)
        .values(
          dto.stations.map((s, i) => ({
            name: s.name,
            emoji: s.emoji,
            display_order: i,
            tenant_id: tenantId,
          })),
        )
        .returning();

      const createdStages = await tx
        .insert(orderStages)
        .values(
          dto.stages.map((s) => ({
            name: s.name,
            sequence: s.sequence,
            tenant_id: tenantId,
          })),
        )
        .returning();

      return {
        stations: createdStations.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        stages: createdStages.map((s) => ({
          id: s.id,
          name: s.name,
          sequence: s.sequence,
        })),
      };
    });
  }
}
