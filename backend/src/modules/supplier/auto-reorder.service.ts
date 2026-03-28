import { Injectable } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';

export interface ReorderPayload {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reorderThreshold: number;
}

@Injectable()
export class AutoReorderService {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Called when inventory drops to or below reorder threshold.
   * Creates a supplier order if no duplicate pending order exists.
   */
  async handleReorderCheck(tenantId: string, payload: ReorderPayload) {
    // Check for existing pending order for this item
    const existingOrder = await this.supplierRepository.findPendingOrderForItem(
      tenantId,
      payload.itemName,
    );

    if (existingOrder) {
      // Duplicate prevention: skip if there's already a pending order
      return null;
    }

    // Find the supplier linked to this location
    const linkedSupplier =
      await this.supplierRepository.findLinkedSupplierForLocation(tenantId);

    if (!linkedSupplier) {
      // No supplier linked — cannot auto-reorder
      return null;
    }

    // Create a supplier order with status 'pending'
    const order = await this.supplierRepository.createSupplierOrder({
      supplier_id: linkedSupplier.supplierId,
      location_id: tenantId,
      items: [
        {
          itemName: payload.itemName,
          quantity: payload.currentQuantity,
          reorderThreshold: payload.reorderThreshold,
        },
      ],
      status: 'pending',
    });

    // Emit reorder event
    this.eventBus.emit({
      event: 'inventory.reorder.triggered',
      payload: {
        orderId: order.id,
        supplierId: linkedSupplier.supplierId,
        itemName: payload.itemName,
        locationId: tenantId,
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    return order;
  }
}
