import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { SUPPLIER_EVENTS } from '@foodtech/shared-types';

@Injectable()
export class SupplierService {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async getLinkedRestaurants(supplierId: string) {
    return this.repository.getLinkedRestaurants(supplierId);
  }

  async createLink(supplierId: string, locationId: string) {
    return this.repository.createSupplierLink(supplierId, locationId);
  }

  async deleteLink(linkId: string) {
    return this.repository.deleteSupplierLink(linkId);
  }

  async getSupplierOrders(supplierId: string) {
    return this.repository.findSupplierOrdersBySupplier(supplierId);
  }

  async getDemandData(supplierId: string) {
    const pendingReordersCount =
      await this.repository.countPendingOrdersBySupplier(supplierId);

    const linkedRestaurants =
      await this.repository.getLinkedRestaurants(supplierId);
    const locationIds = linkedRestaurants.map((r) => r.locationId);

    const approachingThresholdItems =
      await this.repository.getApproachingThresholdItems(locationIds);

    return {
      pendingReordersCount,
      approachingThresholdItems,
    };
  }

  async batchConfirmOrders(supplierId: string, orderIds: string[]) {
    const { confirmed, invalidIds } = await this.repository.batchConfirmOrders(
      orderIds,
      supplierId,
    );

    if (invalidIds.length > 0 && confirmed.length === 0) {
      throw new ForbiddenException(
        'None of the provided orders belong to this supplier',
      );
    }

    // Emit events for each confirmed order
    for (const order of confirmed) {
      this.eventBus.emit({
        event: SUPPLIER_EVENTS.ORDER_CONFIRMED,
        payload: {
          orderId: order.id,
          supplierId,
          locationId: order.location_id,
          confirmedAt: order.confirmed_at?.toISOString(),
        },
        tenantId: order.location_id,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID(),
      });
    }

    return {
      confirmed: confirmed.length,
      failed: invalidIds.length,
    };
  }

  async confirmOrder(supplierId: string, orderId: string) {
    const result = await this.batchConfirmOrders(supplierId, [orderId]);
    if (result.confirmed === 0) {
      throw new ForbiddenException(
        'Order does not belong to this supplier or was not found',
      );
    }
    return { confirmed: true };
  }

  async batchRouteOrders(
    supplierId: string,
    groups: { orderIds: string[]; deliveryTime: string }[],
  ) {
    // Verify ownership of all orders
    const allOrderIds = groups.flatMap((g) => g.orderIds);
    const orders =
      await this.repository.findSupplierOrdersBySupplier(supplierId);
    const supplierOrderIds = new Set(orders.map((o) => o.id));
    const invalidIds = allOrderIds.filter((id) => !supplierOrderIds.has(id));

    if (invalidIds.length > 0) {
      throw new ForbiddenException(
        'Some orders do not belong to this supplier',
      );
    }

    const results = await this.repository.batchRouteOrders(groups);

    // Emit events for each routed order
    for (const result of results) {
      const order = orders.find((o) => o.id === result.orderId);
      if (order) {
        this.eventBus.emit({
          event: SUPPLIER_EVENTS.ORDER_UPDATED,
          payload: {
            orderId: result.orderId,
            supplierId,
            status: 'shipped',
            deliveryTime: result.deliveryTime,
          },
          tenantId: order.location_id,
          timestamp: new Date().toISOString(),
          eventId: crypto.randomUUID(),
        });
      }
    }

    return {
      routed: results.length,
      groups: results,
    };
  }

  async getTrends(supplierId: string, locationId?: string) {
    const inventoryLevels =
      await this.repository.getInventoryForLinkedRestaurants(
        supplierId,
        locationId,
      );

    const frequently86d =
      await this.repository.get86dItemsForLinkedRestaurants(supplierId);

    // Placeholder trending logic: items where current_quantity is below threshold
    const trendingUp = inventoryLevels.filter(
      (item) =>
        item.current_quantity > 0 &&
        item.current_quantity <= item.reorder_threshold * 1.5,
    );

    return {
      inventoryLevels,
      trendingUp,
      frequently86d,
    };
  }

  async getActiveSupplierOrdersForLocation(locationId: string) {
    return this.repository.findActiveSupplierOrdersForLocation(locationId);
  }
}
