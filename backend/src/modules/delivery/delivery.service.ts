import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { locations } from '../../database/schema/locations.schema';
import { orders } from '../../database/schema/orders.schema';
import { orderItems } from '../../database/schema/orders.schema';

const STAGE_ETA: Record<string, number> = {
  received: 15,
  preparing: 8,
  plating: 2,
  served: 0,
};

const STAGE_ORDER: Record<string, number> = {
  served: 0,
  plating: 1,
  preparing: 2,
  received: 3,
};

@Injectable()
export class DeliveryService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async validateApiKey(apiKey: string): Promise<string | null> {
    const result = await this.db
      .select()
      .from(locations)
      .where(eq(locations.api_key, apiKey))
      .limit(1);

    if (result.length === 0) return null;
    return result[0].id;
  }

  async getDeliveryOrders(tenantId: string) {
    const activeStatuses = [
      'received',
      'preparing',
      'plating',
      'served',
    ] as const;
    const allOrders = await this.db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenant_id, tenantId),
          inArray(orders.status, [...activeStatuses]),
        ),
      );

    const result = [];
    for (const order of allOrders) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.order_id, order.id));

      result.push({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        items: items.map((i) => ({
          itemName: i.item_name,
          quantity: i.quantity,
        })),
        createdAt: order.created_at,
        etaMinutes: STAGE_ETA[order.status] ?? 15,
      });
    }

    // Sort: served first, then by stage progression
    result.sort((a, b) => {
      const orderA = STAGE_ORDER[a.status] ?? 4;
      const orderB = STAGE_ORDER[b.status] ?? 4;
      return orderA - orderB;
    });

    return result;
  }

  async pickupOrder(tenantId: string, orderId: string) {
    const order = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenant_id, tenantId)))
      .limit(1);

    if (order.length === 0) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Order Not Found',
        status: 404,
        detail: `Order ${orderId} not found.`,
      });
    }

    if (order[0].status !== 'served') {
      throw new ConflictException({
        type: 'https://foodtech.app/errors/conflict',
        title: 'Order Conflict',
        status: 409,
        detail: `Order ${orderId} is not in served status.`,
      });
    }

    await this.db
      .update(orders)
      .set({ status: 'completed' })
      .where(eq(orders.id, orderId));

    return {
      id: order[0].id,
      orderNumber: order[0].order_number,
      status: 'completed' as const,
    };
  }
}
