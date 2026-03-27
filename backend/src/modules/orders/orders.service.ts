import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { KitchenStatusService } from '../kitchen-status/kitchen-status.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_EVENTS } from '@foodtech/shared-types';

const CONSUMPTION_STAGE = 'preparing';

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly eventBus: EventBusService,
    private readonly kitchenStatusService: KitchenStatusService,
  ) {}

  async createOrder(tenantId: string, dto: CreateOrderDto) {
    const stationIds = [...new Set(dto.items.map((i) => i.stationId))];
    const validStations = await this.repository.findStationsByIds(
      stationIds,
      tenantId,
    );

    if (validStations.length !== stationIds.length) {
      const validIds = new Set(validStations.map((s) => s.id));
      const invalidIds = stationIds.filter((id) => !validIds.has(id));
      throw new BadRequestException({
        type: 'https://foodtech.app/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: `Invalid station IDs: ${invalidIds.join(', ')}`,
      });
    }

    const firstStage = await this.repository.findFirstStage(tenantId);
    const initialStage = firstStage?.name ?? 'received';

    const result = await this.repository.create(
      {
        order_number: dto.orderNumber,
        status: 'received',
        tenant_id: tenantId,
      },
      dto.items.map((item) => ({
        item_name: item.itemName,
        station_id: item.stationId,
        stage: initialStage,
        quantity: item.quantity,
        tenant_id: tenantId,
      })),
    );

    this.eventBus.emit({
      event: ORDER_EVENTS.CREATED,
      payload: {
        orderId: result.order.id,
        orderNumber: result.order.order_number,
        status: result.order.status,
        items: result.items.map((i) => ({
          id: i.id,
          itemName: i.item_name,
          stationId: i.station_id,
          stage: i.stage,
          quantity: i.quantity,
        })),
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    return {
      id: result.order.id,
      orderNumber: result.order.order_number,
      status: result.order.status,
      items: result.items.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        stationId: i.station_id,
        stage: i.stage,
        quantity: i.quantity,
        stageEnteredAt: i.stage_entered_at,
      })),
      createdAt: result.order.created_at,
      stageEnteredAt: result.order.created_at,
    };
  }

  async bumpOrder(tenantId: string, orderId: string) {
    const order = await this.repository.findOrderById(orderId, tenantId);
    if (!order) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Order Not Found',
        status: 404,
        detail: `Order ${orderId} not found.`,
      });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new ConflictException({
        type: 'https://foodtech.app/errors/conflict',
        title: 'Order Conflict',
        status: 409,
        detail: `Order ${orderId} is already ${order.status}.`,
      });
    }

    const items = await this.repository.findOrderItemsByOrderId(orderId);
    const stages = await this.repository.findAllStages(tenantId);
    const stageNames =
      stages.length > 0
        ? stages.map((s) => s.name)
        : ['received', 'preparing', 'plating', 'served'];

    const updatedItems = [];
    for (const item of items) {
      const currentIdx = stageNames.indexOf(item.stage);
      const nextIdx = currentIdx + 1;
      const nextStage =
        nextIdx < stageNames.length ? stageNames[nextIdx] : 'served';

      if (item.stage !== 'served' && item.stage !== 'completed') {
        const stageEnteredAt = new Date();
        await this.repository.updateItemStage(
          item.id,
          nextStage,
          stageEnteredAt,
        );
        updatedItems.push({
          ...item,
          stage: nextStage,
          fromStage: item.stage,
          stage_entered_at: stageEnteredAt,
        });
      } else {
        updatedItems.push({ ...item, fromStage: item.stage });
      }
    }

    // Auto-decrement inventory for items entering the consumption stage
    const consumingItems = updatedItems.filter(
      (i) => i.stage === CONSUMPTION_STAGE && i.fromStage !== CONSUMPTION_STAGE,
    );
    if (consumingItems.length > 0) {
      await this.kitchenStatusService.decrementByOrderItems(
        tenantId,
        consumingItems.map((i) => ({
          itemName: i.item_name,
          quantity: i.quantity,
        })),
      );
    }

    const allServed = updatedItems.every(
      (i) => i.stage === 'served' || i.stage === 'completed',
    );
    if (allServed) {
      await this.repository.updateOrderStatus(orderId, 'completed');
      this.eventBus.emit({
        event: ORDER_EVENTS.COMPLETED,
        payload: {
          orderId,
          orderNumber: order.order_number,
          completedAt: new Date().toISOString(),
          totalTimeMs: Date.now() - new Date(order.created_at).getTime(),
        },
        tenantId,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID(),
      });
    }

    this.eventBus.emit({
      event: ORDER_EVENTS.STAGE_CHANGED,
      payload: {
        orderId,
        orderNumber: order.order_number,
        items: updatedItems.map((i) => ({
          id: i.id,
          fromStage: i.fromStage,
          toStage: i.stage,
          stationId: i.station_id,
        })),
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: allServed ? 'completed' : order.status,
      items: updatedItems.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        stationId: i.station_id,
        stage: i.stage,
        quantity: i.quantity,
        stageEnteredAt: i.stage_entered_at,
      })),
    };
  }

  async findOrders(tenantId: string, stationId?: string) {
    const orders = await this.repository.findOrdersByTenant(
      tenantId,
      stationId,
    );
    return orders;
  }

  async reassignOrder(
    tenantId: string,
    orderId: string,
    targetStationId: string,
  ) {
    const order = await this.repository.findOrderById(orderId, tenantId);
    if (!order) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Order Not Found',
        status: 404,
        detail: `Order ${orderId} not found.`,
      });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new ConflictException({
        type: 'https://foodtech.app/errors/conflict',
        title: 'Order Conflict',
        status: 409,
        detail: `Order ${orderId} is already ${order.status}.`,
      });
    }

    const validStations = await this.repository.findStationsByIds(
      [targetStationId],
      tenantId,
    );
    if (validStations.length === 0) {
      throw new BadRequestException({
        type: 'https://foodtech.app/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: `Invalid target station: ${targetStationId}`,
      });
    }

    const items = await this.repository.findOrderItemsByOrderId(orderId);
    const previousStationId = items[0]?.station_id;

    await this.repository.reassignOrderItems(orderId, targetStationId);

    this.eventBus.emit({
      event: ORDER_EVENTS.STAGE_CHANGED,
      payload: {
        orderId,
        orderNumber: order.order_number,
        action: 'reassigned',
        targetStationId,
        previousStationId,
        items: items.map((i) => ({
          id: i.id,
          fromStage: i.stage,
          toStage: i.stage,
          stationId: targetStationId,
        })),
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      targetStationId,
      previousStationId,
    };
  }

  async revertOrder(tenantId: string, orderId: string) {
    const order = await this.repository.findOrderById(orderId, tenantId);
    if (!order) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Order Not Found',
        status: 404,
        detail: `Order ${orderId} not found.`,
      });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new ConflictException({
        type: 'https://foodtech.app/errors/conflict',
        title: 'Order Conflict',
        status: 409,
        detail: `Order ${orderId} is already ${order.status}.`,
      });
    }

    const items = await this.repository.findOrderItemsByOrderId(orderId);
    const stages = await this.repository.findAllStages(tenantId);
    const stageNames =
      stages.length > 0
        ? stages.map((s) => s.name)
        : ['received', 'preparing', 'plating', 'served'];

    const revertedItems = [];
    for (const item of items) {
      const currentIdx = stageNames.indexOf(item.stage);
      if (currentIdx <= 0) {
        revertedItems.push({ ...item, fromStage: item.stage });
        continue;
      }
      const previousStage = stageNames[currentIdx - 1];
      await this.repository.updateItemStage(item.id, previousStage, new Date());
      revertedItems.push({
        ...item,
        stage: previousStage,
        fromStage: item.stage,
      });
    }

    // If order was completed, revert to active
    if (order.status === 'completed') {
      await this.repository.updateOrderStatus(orderId, 'received');
    }

    this.eventBus.emit({
      event: ORDER_EVENTS.STAGE_CHANGED,
      payload: {
        orderId,
        orderNumber: order.order_number,
        action: 'reverted',
        items: revertedItems.map((i) => ({
          id: i.id,
          fromStage: i.fromStage,
          toStage: i.stage,
          stationId: i.station_id,
        })),
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      items: revertedItems.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        stationId: i.station_id,
        stage: i.stage,
        quantity: i.quantity,
      })),
    };
  }
}
