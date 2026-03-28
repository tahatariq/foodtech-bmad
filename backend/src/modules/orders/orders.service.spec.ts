import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockRepository: {
    create: jest.Mock;
    findStationsByIds: jest.Mock;
    findFirstStage: jest.Mock;
    findOrderById: jest.Mock;
    findOrderItemsByOrderId: jest.Mock;
    findAllStages: jest.Mock;
    updateItemStage: jest.Mock;
    updateOrderStatus: jest.Mock;
    findOrdersByTenant: jest.Mock;
    reassignOrderItems: jest.Mock;
  };
  let mockEventBus: { emit: jest.Mock };
  let mockKitchenStatusService: { decrementByOrderItems: jest.Mock };
  let mockCustomerTrackerService: { generateTrackingToken: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findStationsByIds: jest.fn(),
      findFirstStage: jest.fn(),
      findOrderById: jest.fn(),
      findOrderItemsByOrderId: jest.fn(),
      findAllStages: jest.fn(),
      updateItemStage: jest.fn(),
      updateOrderStatus: jest.fn(),
      findOrdersByTenant: jest.fn(),
      reassignOrderItems: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = { emit: jest.fn() };
    mockKitchenStatusService = {
      decrementByOrderItems: jest.fn().mockResolvedValue(undefined),
    };
    mockCustomerTrackerService = {
      generateTrackingToken: jest.fn().mockReturnValue('a'.repeat(64)),
    };
    service = new OrdersService(
      mockRepository as unknown as import('./orders.repository').OrdersRepository,
      mockEventBus as unknown as import('../../gateways/services/event-bus.service').EventBusService,
      mockKitchenStatusService as unknown as import('../kitchen-status/kitchen-status.service').KitchenStatusService,
      mockCustomerTrackerService as unknown as import('../customer-tracker/customer-tracker.service').CustomerTrackerService,
    );
  });

  it('should create order with status received', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([
      { id: 'station-1', tenant_id: 'tenant-1' },
    ]);
    mockRepository.findFirstStage.mockResolvedValue({
      name: 'received',
      sequence: 0,
    });
    mockRepository.create.mockResolvedValue({
      order: {
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      },
      items: [
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 2,
        },
      ],
    });

    const result = await service.createOrder('tenant-1', {
      orderNumber: 'ORD-001',
      items: [{ itemName: 'Burger', stationId: 'station-1', quantity: 2 }],
    });

    expect(result.status).toBe('received');
    expect(result.orderNumber).toBe('ORD-001');
    expect(result.items).toHaveLength(1);
  });

  it('should assign items to first configured stage', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([
      { id: 'station-1', tenant_id: 'tenant-1' },
    ]);
    mockRepository.findFirstStage.mockResolvedValue({
      name: 'prep',
      sequence: 0,
    });
    mockRepository.create.mockResolvedValue({
      order: {
        id: 'order-1',
        order_number: 'ORD-002',
        status: 'received',
        created_at: new Date(),
      },
      items: [
        {
          id: 'item-1',
          item_name: 'Salad',
          station_id: 'station-1',
          stage: 'prep',
          quantity: 1,
        },
      ],
    });

    const result = await service.createOrder('tenant-1', {
      orderNumber: 'ORD-002',
      items: [{ itemName: 'Salad', stationId: 'station-1', quantity: 1 }],
    });

    expect(result.items[0].stage).toBe('prep');
  });

  it('should include trackingUrl in createOrder response', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([
      { id: 'station-1', tenant_id: 'tenant-1' },
    ]);
    mockRepository.findFirstStage.mockResolvedValue({
      name: 'received',
      sequence: 0,
    });
    mockRepository.create.mockResolvedValue({
      order: {
        id: 'order-1',
        order_number: 'ORD-T01',
        status: 'received',
        created_at: new Date(),
      },
      items: [
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ],
    });

    const result = await service.createOrder('tenant-1', {
      orderNumber: 'ORD-T01',
      items: [{ itemName: 'Burger', stationId: 'station-1', quantity: 1 }],
    });

    expect(result.trackingUrl).toBe(`/track/${'a'.repeat(64)}`);
    expect(mockCustomerTrackerService.generateTrackingToken).toHaveBeenCalled();
  });

  it('should throw when stationId is invalid', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([]);

    await expect(
      service.createOrder('tenant-1', {
        orderNumber: 'ORD-003',
        items: [
          {
            itemName: 'Fries',
            stationId: 'nonexistent-station',
            quantity: 1,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should emit order.created event', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([
      { id: 'station-1', tenant_id: 'tenant-1' },
    ]);
    mockRepository.findFirstStage.mockResolvedValue({
      name: 'received',
      sequence: 0,
    });
    mockRepository.create.mockResolvedValue({
      order: {
        id: 'order-1',
        order_number: 'ORD-004',
        status: 'received',
        created_at: new Date(),
      },
      items: [
        {
          id: 'item-1',
          item_name: 'Pizza',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ],
    });

    await service.createOrder('tenant-1', {
      orderNumber: 'ORD-004',
      items: [{ itemName: 'Pizza', stationId: 'station-1', quantity: 1 }],
    });

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'order.created',
        tenantId: 'tenant-1',
        payload: expect.objectContaining({
          orderId: 'order-1',
          orderNumber: 'ORD-004',
        }),
      }),
    );
  });

  it('should default to received stage when no stages configured', async () => {
    mockRepository.findStationsByIds.mockResolvedValue([
      { id: 'station-1', tenant_id: 'tenant-1' },
    ]);
    mockRepository.findFirstStage.mockResolvedValue(null);
    mockRepository.create.mockImplementation(async (order, items) => ({
      order: {
        id: 'order-1',
        order_number: order.order_number,
        status: order.status,
        created_at: new Date(),
      },
      items: items.map((i: Record<string, unknown>, idx: number) => ({
        id: `item-${idx}`,
        ...i,
      })),
    }));

    await service.createOrder('tenant-1', {
      orderNumber: 'ORD-005',
      items: [{ itemName: 'Soup', stationId: 'station-1', quantity: 1 }],
    });

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ stage: 'received' })]),
    );
  });

  describe('bumpOrder', () => {
    it('should throw NotFoundException for nonexistent order', async () => {
      mockRepository.findOrderById.mockResolvedValue(null);
      await expect(
        service.bumpOrder('tenant-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for completed order', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        status: 'completed',
      });
      await expect(service.bumpOrder('tenant-1', 'order-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for cancelled order', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        status: 'cancelled',
      });
      await expect(service.bumpOrder('tenant-1', 'order-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should advance items to next stage', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'plating', sequence: 2 },
        { name: 'served', sequence: 3 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      const result = await service.bumpOrder('tenant-1', 'order-1');

      expect(mockRepository.updateItemStage).toHaveBeenCalledWith(
        'item-1',
        'preparing',
        expect.any(Date),
      );
      expect(result.items[0].stage).toBe('preparing');
    });

    it('should emit order.stage.changed event', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      await service.bumpOrder('tenant-1', 'order-1');

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'order.stage.changed',
          tenantId: 'tenant-1',
        }),
      );
    });

    it('should not advance items already in served stage', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'served',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'served', sequence: 2 },
      ]);
      mockRepository.updateOrderStatus.mockResolvedValue(undefined);

      const result = await service.bumpOrder('tenant-1', 'order-1');

      // updateItemStage should NOT be called for already-served items
      expect(mockRepository.updateItemStage).not.toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });

    it('should return current state in response for reconciliation', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      const result = await service.bumpOrder('tenant-1', 'order-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderNumber');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('items');
      expect(result.items[0]).toHaveProperty('stage', 'preparing');
    });

    it('should auto-decrement inventory when items advance to preparing', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Salmon',
          station_id: 'station-1',
          stage: 'received',
          quantity: 2,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'served', sequence: 2 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      await service.bumpOrder('tenant-1', 'order-1');

      expect(
        mockKitchenStatusService.decrementByOrderItems,
      ).toHaveBeenCalledWith('tenant-1', [{ itemName: 'Salmon', quantity: 2 }]);
    });

    it('should NOT auto-decrement when advancing to non-consumption stage', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Salmon',
          station_id: 'station-1',
          stage: 'preparing',
          quantity: 2,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'plating', sequence: 2 },
        { name: 'served', sequence: 3 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      await service.bumpOrder('tenant-1', 'order-1');

      expect(
        mockKitchenStatusService.decrementByOrderItems,
      ).not.toHaveBeenCalled();
    });

    it('should mark order completed when all items served', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
        created_at: new Date(Date.now() - 300000),
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'plating',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'plating', sequence: 2 },
        { name: 'served', sequence: 3 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);
      mockRepository.updateOrderStatus.mockResolvedValue(undefined);

      const result = await service.bumpOrder('tenant-1', 'order-1');

      expect(result.status).toBe('completed');
      expect(mockRepository.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'completed',
      );
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'order.completed',
        }),
      );
    });
  });

  describe('reassignOrder', () => {
    it('should reassign order items to target station', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
      });
      mockRepository.findStationsByIds.mockResolvedValue([
        { id: 'station-2', tenant_id: 'tenant-1' },
      ]);
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        { id: 'item-1', station_id: 'station-1', stage: 'preparing' },
      ]);

      const result = await service.reassignOrder(
        'tenant-1',
        'order-1',
        'station-2',
      );

      expect(mockRepository.reassignOrderItems).toHaveBeenCalledWith(
        'order-1',
        'station-2',
      );
      expect(result.targetStationId).toBe('station-2');
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'order.stage.changed',
          payload: expect.objectContaining({ action: 'reassigned' }),
        }),
      );
    });

    it('should throw NotFoundException for nonexistent order', async () => {
      mockRepository.findOrderById.mockResolvedValue(null);
      await expect(
        service.reassignOrder('tenant-1', 'nonexistent', 'station-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revertOrder', () => {
    it('should revert order items to previous stage', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'preparing',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
        { name: 'served', sequence: 2 },
      ]);
      mockRepository.updateItemStage.mockResolvedValue(undefined);

      const result = await service.revertOrder('tenant-1', 'order-1');

      expect(mockRepository.updateItemStage).toHaveBeenCalledWith(
        'item-1',
        'received',
        expect.any(Date),
      );
      expect(result.items[0].stage).toBe('received');
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'order.stage.changed',
          payload: expect.objectContaining({ action: 'reverted' }),
        }),
      );
    });

    it('should not revert items at first stage', async () => {
      mockRepository.findOrderById.mockResolvedValue({
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'received',
      });
      mockRepository.findOrderItemsByOrderId.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Burger',
          station_id: 'station-1',
          stage: 'received',
          quantity: 1,
        },
      ]);
      mockRepository.findAllStages.mockResolvedValue([
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
      ]);

      const result = await service.revertOrder('tenant-1', 'order-1');

      expect(mockRepository.updateItemStage).not.toHaveBeenCalled();
      expect(result.items[0].stage).toBe('received');
    });
  });
});
