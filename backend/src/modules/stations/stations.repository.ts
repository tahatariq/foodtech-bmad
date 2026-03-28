import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { stations } from '../../database/schema/stations.schema';
import { orderStages } from '../../database/schema/orders.schema';

@Injectable()
export class StationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createStation(data: {
    name: string;
    emoji?: string;
    display_order: number;
    tenant_id: string;
  }) {
    const result = await this.db.insert(stations).values(data).returning();
    return result[0];
  }

  async findStationsByTenant(tenantId: string) {
    return this.db
      .select()
      .from(stations)
      .where(
        and(eq(stations.tenant_id, tenantId), eq(stations.is_active, true)),
      )
      .orderBy(stations.display_order);
  }

  async createOrderStages(
    stagesData: { name: string; sequence: number; tenant_id: string }[],
  ) {
    if (stagesData.length === 0) return [];
    return this.db.insert(orderStages).values(stagesData).returning();
  }

  async deleteOrderStagesByTenant(tenantId: string) {
    return this.db
      .delete(orderStages)
      .where(eq(orderStages.tenant_id, tenantId));
  }

  async findOrderStagesByTenant(tenantId: string) {
    return this.db
      .select()
      .from(orderStages)
      .where(eq(orderStages.tenant_id, tenantId))
      .orderBy(orderStages.sequence);
  }

  async findOrderStageById(stageId: string, tenantId: string) {
    const result = await this.db
      .select()
      .from(orderStages)
      .where(
        and(eq(orderStages.id, stageId), eq(orderStages.tenant_id, tenantId)),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async updateOrderStageThresholds(
    stageId: string,
    data: {
      warning_threshold_minutes?: number;
      critical_threshold_minutes?: number;
    },
  ) {
    const result = await this.db
      .update(orderStages)
      .set(data)
      .where(eq(orderStages.id, stageId))
      .returning();
    return result[0];
  }
}
