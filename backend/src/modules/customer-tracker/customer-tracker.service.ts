import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { orders } from '../../database/schema/orders.schema';
import { orderItems } from '../../database/schema/orders.schema';
import crypto from 'crypto';

@Injectable()
export class CustomerTrackerService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  generateTrackingToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async findOrderByToken(token: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.tracking_token, token))
      .limit(1);

    if (!order) return null;

    if (
      order.tracking_token_expires_at &&
      new Date() > new Date(order.tracking_token_expires_at)
    ) {
      return { expired: true };
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, order.id));

    return {
      expired: false,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      items: items.map((i) => ({
        itemName: i.item_name,
        stage: i.stage,
        quantity: i.quantity,
      })),
      createdAt: order.created_at,
    };
  }
}
