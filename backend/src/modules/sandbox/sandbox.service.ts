import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { organizations } from '../../database/schema/organizations.schema';
import { locations } from '../../database/schema/locations.schema';
import { stations } from '../../database/schema/stations.schema';
import {
  orderStages,
  orders,
  orderItems,
} from '../../database/schema/orders.schema';
import { inventoryItems } from '../../database/schema/inventory.schema';
import { apiKeys } from '../../database/schema/api-keys.schema';
import { webhookSubscriptions } from '../../database/schema/webhooks.schema';
import { createHash, randomBytes } from 'crypto';

const SAMPLE_STATIONS = ['Grill', 'Salad', 'Desserts'];

const SAMPLE_ORDER_STAGES = [
  { name: 'Received', sequence: 1 },
  { name: 'Preparing', sequence: 2 },
  { name: 'Plating', sequence: 3 },
  { name: 'Served', sequence: 4 },
];

const SAMPLE_INVENTORY_ITEMS = [
  {
    item_name: 'Beef Patty',
    current_quantity: 50,
    reorder_threshold: 10,
    reorder_quantity: 40,
  },
  {
    item_name: 'Chicken Breast',
    current_quantity: 30,
    reorder_threshold: 8,
    reorder_quantity: 25,
  },
  {
    item_name: 'Lettuce',
    current_quantity: 40,
    reorder_threshold: 10,
    reorder_quantity: 30,
  },
  {
    item_name: 'Tomato',
    current_quantity: 35,
    reorder_threshold: 8,
    reorder_quantity: 25,
  },
  {
    item_name: 'Cheddar Cheese',
    current_quantity: 25,
    reorder_threshold: 5,
    reorder_quantity: 20,
  },
  {
    item_name: 'Buns',
    current_quantity: 60,
    reorder_threshold: 15,
    reorder_quantity: 50,
  },
  {
    item_name: 'French Fries',
    current_quantity: 45,
    reorder_threshold: 12,
    reorder_quantity: 35,
  },
  {
    item_name: 'Chocolate Cake',
    current_quantity: 15,
    reorder_threshold: 3,
    reorder_quantity: 10,
  },
  {
    item_name: 'Ice Cream',
    current_quantity: 20,
    reorder_threshold: 5,
    reorder_quantity: 15,
  },
  {
    item_name: 'Olive Oil',
    current_quantity: 10,
    reorder_threshold: 2,
    reorder_quantity: 8,
  },
];

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  async provisionSandbox() {
    return this.db.transaction(async (tx) => {
      const sandboxName = `Sandbox-${randomBytes(4).toString('hex')}`;
      const slug = `sandbox-${Date.now()}`;

      // Create org
      const [org] = await tx
        .insert(organizations)
        .values({
          name: sandboxName,
          slug,
          subscription_tier: 'indie',
        })
        .returning();

      // Create location with is_sandbox=true
      const [location] = await tx
        .insert(locations)
        .values({
          organization_id: org.id,
          name: sandboxName,
          is_sandbox: true,
          last_activity_at: new Date(),
        })
        .returning();

      const tenantId = location.id;

      // Create sample stations
      await tx.insert(stations).values(
        SAMPLE_STATIONS.map((name, i) => ({
          name,
          display_order: i,
          tenant_id: tenantId,
        })),
      );

      // Create sample order stages
      await tx.insert(orderStages).values(
        SAMPLE_ORDER_STAGES.map((s) => ({
          name: s.name,
          sequence: s.sequence,
          tenant_id: tenantId,
        })),
      );

      // Create sample inventory items
      await tx.insert(inventoryItems).values(
        SAMPLE_INVENTORY_ITEMS.map((item) => ({
          ...item,
          tenant_id: tenantId,
        })),
      );

      // Generate API key
      const key = `ft_key_${randomBytes(16).toString('hex')}`;
      const secret = randomBytes(32).toString('hex');
      const keyPrefix = key.slice(0, 12);

      await tx.insert(apiKeys).values({
        tenant_id: tenantId,
        key_prefix: keyPrefix,
        key_hash: this.hash(key),
        secret_hash: this.hash(secret),
      });

      this.logger.log(`Provisioned sandbox tenant ${tenantId}`);

      return {
        tenantId,
        apiKey: key,
        apiSecret: secret,
        endpoints: {
          orders: `/api/v1/orders`,
          webhooks: `/api/v1/integrations/${tenantId}/webhooks`,
        },
      };
    });
  }

  async getSandboxStatus(tenantId: string) {
    const [location] = await this.db
      .select()
      .from(locations)
      .where(and(eq(locations.id, tenantId), eq(locations.is_sandbox, true)));

    if (!location) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Sandbox Not Found',
        status: 404,
        detail: `Sandbox tenant ${tenantId} not found.`,
      });
    }

    const orderCountResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.tenant_id, tenantId));

    return {
      tenantId,
      name: location.name,
      is_sandbox: true,
      orderCount: orderCountResult[0]?.count ?? 0,
      lastActivity: location.last_activity_at,
      createdAt: location.created_at,
    };
  }

  async deleteSandbox(tenantId: string) {
    const [location] = await this.db
      .select()
      .from(locations)
      .where(eq(locations.id, tenantId));

    if (!location) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Sandbox Not Found',
        status: 404,
        detail: `Tenant ${tenantId} not found.`,
      });
    }

    if (!location.is_sandbox) {
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/forbidden',
        title: 'Not a Sandbox',
        status: 403,
        detail: 'Cannot delete a non-sandbox tenant via this endpoint.',
      });
    }

    // Delete in cascade order
    // 1. order_items (references orders and stations)
    await this.db.delete(orderItems).where(eq(orderItems.tenant_id, tenantId));

    // 2. orders
    await this.db.delete(orders).where(eq(orders.tenant_id, tenantId));

    // 3. inventory_items
    await this.db
      .delete(inventoryItems)
      .where(eq(inventoryItems.tenant_id, tenantId));

    // 4. order_stages
    await this.db
      .delete(orderStages)
      .where(eq(orderStages.tenant_id, tenantId));

    // 5. stations
    await this.db.delete(stations).where(eq(stations.tenant_id, tenantId));

    // 6. webhook_subscriptions
    await this.db
      .delete(webhookSubscriptions)
      .where(eq(webhookSubscriptions.tenant_id, tenantId));

    // 7. api_keys
    await this.db.delete(apiKeys).where(eq(apiKeys.tenant_id, tenantId));

    // 8. location
    await this.db.delete(locations).where(eq(locations.id, tenantId));

    this.logger.log(`Deleted sandbox tenant ${tenantId}`);

    return { deleted: true, tenantId };
  }

  async findInactiveSandboxes(olderThanDays: number) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    return this.db
      .select({
        id: locations.id,
        name: locations.name,
        last_activity_at: locations.last_activity_at,
      })
      .from(locations)
      .where(
        and(
          eq(locations.is_sandbox, true),
          sql`${locations.last_activity_at} < ${cutoff}`,
        ),
      );
  }
}
