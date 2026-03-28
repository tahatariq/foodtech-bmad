import { Inject, Injectable } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { orders } from '../../database/schema/orders.schema';
import { orderItems } from '../../database/schema/orders.schema';
import { orderStages } from '../../database/schema/orders.schema';
import { stations } from '../../database/schema/stations.schema';
import type { OrderStatus } from '@foodtech/shared-types';

@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(
    order: {
      order_number: string;
      status: OrderStatus;
      tenant_id: string;
      tracking_token?: string;
      tracking_token_expires_at?: Date;
    },
    items: {
      item_name: string;
      station_id: string;
      stage: OrderStatus;
      quantity: number;
      tenant_id: string;
    }[],
  ) {
    return this.db.transaction(async (tx) => {
      const [createdOrder] = await tx.insert(orders).values(order).returning();

      const createdItems = await tx
        .insert(orderItems)
        .values(
          items.map((item) => ({
            ...item,
            order_id: createdOrder.id,
          })),
        )
        .returning();

      return { order: createdOrder, items: createdItems };
    });
  }

  async findStationsByIds(stationIds: string[], tenantId: string) {
    if (stationIds.length === 0) return [];
    return this.db
      .select()
      .from(stations)
      .where(
        and(inArray(stations.id, stationIds), eq(stations.tenant_id, tenantId)),
      );
  }

  async findFirstStage(tenantId: string) {
    const result = await this.db
      .select()
      .from(orderStages)
      .where(eq(orderStages.tenant_id, tenantId))
      .orderBy(orderStages.sequence)
      .limit(1);
    return result[0] ?? null;
  }

  async findOrderById(orderId: string, tenantId: string) {
    const result = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenant_id, tenantId)))
      .limit(1);
    return result[0] ?? null;
  }

  async findOrderItemsByOrderId(orderId: string) {
    return this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId));
  }

  async findAllStages(tenantId: string) {
    return this.db
      .select()
      .from(orderStages)
      .where(eq(orderStages.tenant_id, tenantId))
      .orderBy(orderStages.sequence);
  }

  async updateItemStage(
    itemId: string,
    stage: OrderStatus,
    stageEnteredAt?: Date,
  ) {
    return this.db
      .update(orderItems)
      .set({
        stage,
        ...(stageEnteredAt ? { stage_entered_at: stageEnteredAt } : {}),
      })
      .where(eq(orderItems.id, itemId));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.db.update(orders).set({ status }).where(eq(orders.id, orderId));
  }

  async reassignOrderItems(orderId: string, targetStationId: string) {
    return this.db
      .update(orderItems)
      .set({ station_id: targetStationId })
      .where(eq(orderItems.order_id, orderId));
  }

  async findOrdersByTenant(tenantId: string, stationId?: string) {
    const allOrders = await this.db
      .select()
      .from(orders)
      .where(
        and(eq(orders.tenant_id, tenantId), eq(orders.status, 'received')),
      );

    const result = [];
    for (const order of allOrders) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(
          stationId
            ? and(
                eq(orderItems.order_id, order.id),
                eq(orderItems.station_id, stationId),
              )
            : eq(orderItems.order_id, order.id),
        );

      if (items.length > 0) {
        result.push({
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          items: items.map((i) => ({
            id: i.id,
            itemName: i.item_name,
            stationId: i.station_id,
            stage: i.stage,
            quantity: i.quantity,
            stageEnteredAt: i.stage_entered_at,
          })),
          createdAt: order.created_at,
          stageEnteredAt: order.created_at,
        });
      }
    }

    return result;
  }
}
