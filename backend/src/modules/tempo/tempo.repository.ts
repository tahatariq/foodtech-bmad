import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { orderItems } from '../../database/schema/orders.schema';
import { stations } from '../../database/schema/stations.schema';

@Injectable()
export class TempoRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getActiveOrderItems(tenantId: string) {
    return this.db
      .select({
        id: orderItems.id,
        station_id: orderItems.station_id,
        station_name: stations.name,
        stage: orderItems.stage,
        stage_entered_at: orderItems.stage_entered_at,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .leftJoin(stations, eq(orderItems.station_id, stations.id))
      .where(
        and(
          eq(orderItems.tenant_id, tenantId),
          sql`${orderItems.stage} NOT IN ('served', 'completed')`,
        ),
      );
  }
}
