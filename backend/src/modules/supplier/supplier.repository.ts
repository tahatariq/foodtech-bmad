import { Inject, Injectable } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import {
  suppliers,
  supplierRestaurantLinks,
  supplierOrders,
} from '../../database/schema/suppliers.schema';
import { locations } from '../../database/schema/locations.schema';
import { inventoryItems } from '../../database/schema/inventory.schema';
import type { SupplierOrderStatus } from '@foodtech/shared-types';

@Injectable()
export class SupplierRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findSupplierById(id: string) {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    return supplier ?? null;
  }

  async findSupplierByEmail(email: string) {
    const [supplier] = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.email, email))
      .limit(1);
    return supplier ?? null;
  }

  async getLinkedRestaurants(supplierId: string) {
    return this.db
      .select({
        linkId: supplierRestaurantLinks.id,
        locationId: locations.id,
        locationName: locations.name,
        address: locations.address,
        organizationId: locations.organization_id,
      })
      .from(supplierRestaurantLinks)
      .innerJoin(
        locations,
        eq(supplierRestaurantLinks.location_id, locations.id),
      )
      .where(eq(supplierRestaurantLinks.supplier_id, supplierId));
  }

  async createSupplierLink(supplierId: string, locationId: string) {
    const [link] = await this.db
      .insert(supplierRestaurantLinks)
      .values({ supplier_id: supplierId, location_id: locationId })
      .returning();
    return link;
  }

  async deleteSupplierLink(linkId: string) {
    await this.db
      .delete(supplierRestaurantLinks)
      .where(eq(supplierRestaurantLinks.id, linkId));
  }

  async createSupplierOrder(data: {
    supplier_id: string;
    location_id: string;
    items: unknown;
    status?: SupplierOrderStatus;
  }) {
    const [order] = await this.db
      .insert(supplierOrders)
      .values({
        supplier_id: data.supplier_id,
        location_id: data.location_id,
        items: data.items,
        status: data.status ?? 'pending',
      })
      .returning();
    return order;
  }

  async findPendingOrderForItem(locationId: string, itemName: string) {
    const rows = await this.db
      .select()
      .from(supplierOrders)
      .where(
        and(
          eq(supplierOrders.location_id, locationId),
          eq(supplierOrders.status, 'pending'),
        ),
      );

    // Check if any pending order already contains this item
    return (
      rows.find((row) => {
        const items = row.items as Array<{ itemName: string }>;
        return (
          Array.isArray(items) && items.some((i) => i.itemName === itemName)
        );
      }) ?? null
    );
  }

  async findSupplierOrdersBySupplier(supplierId: string) {
    return this.db
      .select()
      .from(supplierOrders)
      .where(eq(supplierOrders.supplier_id, supplierId));
  }

  async updateSupplierOrderStatus(
    orderId: string,
    status: SupplierOrderStatus,
    timestampFields?: Record<string, Date>,
  ) {
    const [updated] = await this.db
      .update(supplierOrders)
      .set({ status, ...timestampFields })
      .where(eq(supplierOrders.id, orderId))
      .returning();
    return updated ?? null;
  }

  async findLinkedSupplierForLocation(locationId: string) {
    const [link] = await this.db
      .select({
        supplierId: supplierRestaurantLinks.supplier_id,
        linkId: supplierRestaurantLinks.id,
      })
      .from(supplierRestaurantLinks)
      .where(eq(supplierRestaurantLinks.location_id, locationId))
      .limit(1);
    return link ?? null;
  }

  async getApproachingThresholdItems(locationIds: string[]) {
    if (locationIds.length === 0) return [];
    const allItems: Array<{
      id: string;
      item_name: string;
      current_quantity: number;
      reorder_threshold: number;
      tenant_id: string;
    }> = [];

    for (const locId of locationIds) {
      const items = await this.db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.tenant_id, locId));
      for (const item of items) {
        if (
          item.current_quantity > 0 &&
          item.current_quantity <= item.reorder_threshold
        ) {
          allItems.push(item);
        }
      }
    }
    return allItems;
  }

  async countPendingOrdersBySupplier(supplierId: string) {
    const rows = await this.db
      .select()
      .from(supplierOrders)
      .where(
        and(
          eq(supplierOrders.supplier_id, supplierId),
          eq(supplierOrders.status, 'pending'),
        ),
      );
    return rows.length;
  }

  async batchConfirmOrders(orderIds: string[], supplierId: string) {
    const orders = await this.db
      .select()
      .from(supplierOrders)
      .where(
        and(
          inArray(supplierOrders.id, orderIds),
          eq(supplierOrders.supplier_id, supplierId),
        ),
      );

    const validIds = orders.map((o) => o.id);
    const invalidIds = orderIds.filter((id) => !validIds.includes(id));
    const confirmed: typeof orders = [];

    for (const id of validIds) {
      const [updated] = await this.db
        .update(supplierOrders)
        .set({ status: 'confirmed', confirmed_at: new Date() })
        .where(eq(supplierOrders.id, id))
        .returning();
      if (updated) confirmed.push(updated);
    }

    return { confirmed, invalidIds };
  }

  async batchRouteOrders(
    groups: { orderIds: string[]; deliveryTime: string }[],
  ) {
    const results: Array<{
      orderId: string;
      deliveryTime: string;
      status: string;
    }> = [];

    for (const group of groups) {
      for (const orderId of group.orderIds) {
        const [updated] = await this.db
          .update(supplierOrders)
          .set({
            status: 'shipped',
            shipped_at: new Date(),
            deliver_by: new Date(group.deliveryTime),
          })
          .where(eq(supplierOrders.id, orderId))
          .returning();
        if (updated) {
          results.push({
            orderId: updated.id,
            deliveryTime: group.deliveryTime,
            status: updated.status,
          });
        }
      }
    }

    return results;
  }

  async getInventoryForLinkedRestaurants(
    supplierId: string,
    locationId?: string,
  ) {
    const links = await this.getLinkedRestaurants(supplierId);
    let locationIds = links.map((l) => l.locationId);
    if (locationId) {
      locationIds = locationIds.filter((id) => id === locationId);
    }
    if (locationIds.length === 0) return [];

    const allItems: Array<{
      id: string;
      item_name: string;
      current_quantity: number;
      reorder_threshold: number;
      is_86d: boolean;
      tenant_id: string;
    }> = [];

    for (const locId of locationIds) {
      const items = await this.db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.tenant_id, locId));
      allItems.push(...items);
    }

    return allItems;
  }

  async get86dItemsForLinkedRestaurants(supplierId: string) {
    const links = await this.getLinkedRestaurants(supplierId);
    const locationIds = links.map((l) => l.locationId);
    if (locationIds.length === 0) return [];

    const allItems: Array<{
      id: string;
      item_name: string;
      current_quantity: number;
      is_86d: boolean;
      tenant_id: string;
    }> = [];

    for (const locId of locationIds) {
      const items = await this.db
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.tenant_id, locId),
            eq(inventoryItems.is_86d, true),
          ),
        );
      allItems.push(...items);
    }

    return allItems;
  }

  async findActiveSupplierOrdersForLocation(locationId: string) {
    const activeStatuses: SupplierOrderStatus[] = [
      'pending',
      'confirmed',
      'shipped',
    ];
    const orders = await this.db
      .select({
        id: supplierOrders.id,
        items: supplierOrders.items,
        status: supplierOrders.status,
        deliver_by: supplierOrders.deliver_by,
        confirmed_at: supplierOrders.confirmed_at,
        shipped_at: supplierOrders.shipped_at,
        created_at: supplierOrders.created_at,
        supplier_name: suppliers.name,
      })
      .from(supplierOrders)
      .innerJoin(suppliers, eq(supplierOrders.supplier_id, suppliers.id))
      .where(
        and(
          eq(supplierOrders.location_id, locationId),
          inArray(supplierOrders.status, activeStatuses),
        ),
      );

    return orders;
  }
}
