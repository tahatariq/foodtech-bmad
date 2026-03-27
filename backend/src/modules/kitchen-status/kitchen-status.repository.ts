import { Inject, Injectable } from '@nestjs/common';
import { eq, and, inArray, count, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import {
  inventoryItems,
  prepChecklists,
  checklistItems,
} from '../../database/schema/inventory.schema';
import { orderItems } from '../../database/schema/orders.schema';
import { stations } from '../../database/schema/stations.schema';

@Injectable()
export class KitchenStatusRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createItem(
    tenantId: string,
    data: {
      item_name: string;
      current_quantity: number;
      reorder_threshold: number;
    },
  ) {
    const [item] = await this.db
      .insert(inventoryItems)
      .values({ ...data, tenant_id: tenantId })
      .returning();
    return item;
  }

  async findAllByTenant(tenantId: string) {
    return this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.tenant_id, tenantId));
  }

  async findById(tenantId: string, itemId: string) {
    const [item] = await this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.tenant_id, tenantId),
        ),
      );
    return item ?? null;
  }

  async updateQuantity(tenantId: string, itemId: string, newQuantity: number) {
    const is86d = newQuantity <= 0;
    const [updated] = await this.db
      .update(inventoryItems)
      .set({
        current_quantity: newQuantity,
        is_86d: is86d,
      })
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.tenant_id, tenantId),
        ),
      )
      .returning();
    return updated ?? null;
  }

  async find86dItems(tenantId: string) {
    return this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.tenant_id, tenantId),
          eq(inventoryItems.is_86d, true),
        ),
      );
  }

  async decrementQuantity(tenantId: string, itemId: string, amount: number) {
    const item = await this.findById(tenantId, itemId);
    if (!item) return null;
    const newQty = Math.max(0, item.current_quantity - amount);
    return this.updateQuantity(tenantId, itemId, newQty);
  }

  async findByNames(tenantId: string, names: string[]) {
    if (names.length === 0) return [];
    return this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.tenant_id, tenantId),
          inArray(inventoryItems.item_name, names),
        ),
      );
  }

  // Checklist methods

  async createChecklist(
    tenantId: string,
    data: { station_id: string; name: string },
  ) {
    const [checklist] = await this.db
      .insert(prepChecklists)
      .values({ ...data, tenant_id: tenantId })
      .returning();
    return checklist;
  }

  async findChecklistByStation(tenantId: string, stationId: string) {
    const [checklist] = await this.db
      .select()
      .from(prepChecklists)
      .where(
        and(
          eq(prepChecklists.station_id, stationId),
          eq(prepChecklists.tenant_id, tenantId),
        ),
      );
    return checklist ?? null;
  }

  async findChecklistItems(checklistId: string) {
    return this.db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.checklist_id, checklistId));
  }

  async addChecklistItem(checklistId: string, description: string) {
    const [item] = await this.db
      .insert(checklistItems)
      .values({ checklist_id: checklistId, description })
      .returning();
    return item;
  }

  async toggleChecklistItem(
    itemId: string,
    isCompleted: boolean,
    userId?: string,
  ) {
    const [updated] = await this.db
      .update(checklistItems)
      .set({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
        completed_by: isCompleted ? (userId ?? null) : null,
      })
      .where(eq(checklistItems.id, itemId))
      .returning();
    return updated ?? null;
  }

  async deleteChecklistItem(itemId: string) {
    await this.db.delete(checklistItems).where(eq(checklistItems.id, itemId));
  }

  // Station status methods

  async getActiveTicketCountByStation(tenantId: string, stationId: string) {
    const result = await this.db
      .select({ count: count() })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.tenant_id, tenantId),
          eq(orderItems.station_id, stationId),
          sql`${orderItems.stage} NOT IN ('served', 'completed')`,
        ),
      );
    return result[0]?.count ?? 0;
  }

  async getOldestTicketAge(tenantId: string, stationId: string) {
    const result = await this.db
      .select({
        oldest: sql<string>`MIN(${orderItems.stage_entered_at})`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.tenant_id, tenantId),
          eq(orderItems.station_id, stationId),
          sql`${orderItems.stage} NOT IN ('served', 'completed')`,
        ),
      );
    return result[0]?.oldest ? new Date(result[0].oldest) : null;
  }

  async getAllStationsWithStatus(tenantId: string) {
    return this.db
      .select()
      .from(stations)
      .where(
        and(eq(stations.tenant_id, tenantId), eq(stations.is_active, true)),
      );
  }
}
