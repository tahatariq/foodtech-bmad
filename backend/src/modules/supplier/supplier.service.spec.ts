import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierRepository } from './supplier.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { SUPPLIER_EVENTS } from '@foodtech/shared-types';

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: jest.Mocked<SupplierRepository>;
  let eventBus: jest.Mocked<EventBusService>;

  const supplierId = 'supplier-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: SupplierRepository,
          useValue: {
            findSupplierById: jest.fn().mockResolvedValue(null),
            findSupplierByEmail: jest.fn().mockResolvedValue(null),
            getLinkedRestaurants: jest.fn().mockResolvedValue([]),
            createSupplierLink: jest.fn().mockResolvedValue({}),
            deleteSupplierLink: jest.fn().mockResolvedValue(undefined),
            createSupplierOrder: jest.fn().mockResolvedValue({}),
            findPendingOrderForItem: jest.fn().mockResolvedValue(null),
            findSupplierOrdersBySupplier: jest.fn().mockResolvedValue([]),
            updateSupplierOrderStatus: jest.fn().mockResolvedValue(null),
            findLinkedSupplierForLocation: jest.fn().mockResolvedValue(null),
            getApproachingThresholdItems: jest.fn().mockResolvedValue([]),
            countPendingOrdersBySupplier: jest.fn().mockResolvedValue(0),
            batchConfirmOrders: jest.fn().mockResolvedValue({
              confirmed: [],
              invalidIds: [],
            }),
            batchRouteOrders: jest.fn().mockResolvedValue([]),
            getInventoryForLinkedRestaurants: jest.fn().mockResolvedValue([]),
            get86dItemsForLinkedRestaurants: jest.fn().mockResolvedValue([]),
            findActiveSupplierOrdersForLocation: jest
              .fn()
              .mockResolvedValue([]),
          },
        },
        {
          provide: EventBusService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SupplierService);
    repository = module.get(SupplierRepository);
    eventBus = module.get(EventBusService);
  });

  describe('getLinkedRestaurants', () => {
    it('should return linked locations for a supplier', async () => {
      const mockLocations = [
        {
          linkId: 'link-1',
          locationId: 'loc-1',
          locationName: 'Downtown Kitchen',
          address: '123 Main St',
          organizationId: 'org-1',
        },
        {
          linkId: 'link-2',
          locationId: 'loc-2',
          locationName: 'Airport Kitchen',
          address: '456 Airport Rd',
          organizationId: 'org-1',
        },
      ];
      repository.getLinkedRestaurants.mockResolvedValue(mockLocations);

      const result = await service.getLinkedRestaurants(supplierId);

      expect(repository.getLinkedRestaurants).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(mockLocations);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no linked locations', async () => {
      repository.getLinkedRestaurants.mockResolvedValue([]);

      const result = await service.getLinkedRestaurants(supplierId);

      expect(result).toEqual([]);
    });
  });

  describe('createLink', () => {
    it('should create a supplier-restaurant link', async () => {
      const mockLink = {
        id: 'link-1',
        supplier_id: supplierId,
        location_id: 'loc-1',
        created_at: new Date(),
      };
      repository.createSupplierLink.mockResolvedValue(mockLink);

      const result = await service.createLink(supplierId, 'loc-1');

      expect(repository.createSupplierLink).toHaveBeenCalledWith(
        supplierId,
        'loc-1',
      );
      expect(result).toEqual(mockLink);
    });
  });

  describe('deleteLink', () => {
    it('should delete a supplier-restaurant link', async () => {
      await service.deleteLink('link-1');

      expect(repository.deleteSupplierLink).toHaveBeenCalledWith('link-1');
    });
  });

  describe('getDemandData', () => {
    it('should return demand data with pending count and threshold items', async () => {
      repository.countPendingOrdersBySupplier.mockResolvedValue(3);
      repository.getLinkedRestaurants.mockResolvedValue([
        {
          linkId: 'link-1',
          locationId: 'loc-1',
          locationName: 'Kitchen',
          address: null,
          organizationId: 'org-1',
        },
      ]);
      repository.getApproachingThresholdItems.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 3,
          reorder_threshold: 5,
          tenant_id: 'loc-1',
        },
      ]);

      const result = await service.getDemandData(supplierId);

      expect(result.pendingReordersCount).toBe(3);
      expect(result.approachingThresholdItems).toHaveLength(1);
      expect(result.approachingThresholdItems[0]).toEqual(
        expect.objectContaining({ item_name: 'Salmon' }),
      );
    });

    it('should return zero counts when no data', async () => {
      repository.countPendingOrdersBySupplier.mockResolvedValue(0);
      repository.getLinkedRestaurants.mockResolvedValue([]);
      repository.getApproachingThresholdItems.mockResolvedValue([]);

      const result = await service.getDemandData(supplierId);

      expect(result.pendingReordersCount).toBe(0);
      expect(result.approachingThresholdItems).toHaveLength(0);
    });
  });

  describe('getSupplierOrders', () => {
    it('should return orders for a supplier', async () => {
      const mockOrders = [
        { id: 'order-1', supplier_id: supplierId, status: 'pending' },
      ];
      repository.findSupplierOrdersBySupplier.mockResolvedValue(
        mockOrders as any,
      );

      const result = await service.getSupplierOrders(supplierId);

      expect(repository.findSupplierOrdersBySupplier).toHaveBeenCalledWith(
        supplierId,
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('batchConfirmOrders', () => {
    it('should confirm multiple orders and emit events', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          confirmed_at: new Date(),
          deliver_by: null,
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'order-2',
          supplier_id: supplierId,
          location_id: 'loc-2',
          items: [],
          status: 'confirmed' as const,
          confirmed_at: new Date(),
          deliver_by: null,
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: orders,
        invalidIds: [],
      });

      const result = await service.batchConfirmOrders(supplierId, [
        'order-1',
        'order-2',
      ]);

      expect(result).toEqual({ confirmed: 2, failed: 0 });
      expect(eventBus.emit).toHaveBeenCalledTimes(2);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SUPPLIER_EVENTS.ORDER_CONFIRMED,
          tenantId: 'loc-1',
        }),
      );
    });

    it('should throw ForbiddenException when no orders belong to supplier', async () => {
      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: [],
        invalidIds: ['order-999'],
      });

      await expect(
        service.batchConfirmOrders(supplierId, ['order-999']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return partial results when some orders are invalid', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          confirmed_at: new Date(),
          deliver_by: null,
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: orders,
        invalidIds: ['order-bad'],
      });

      const result = await service.batchConfirmOrders(supplierId, [
        'order-1',
        'order-bad',
      ]);

      expect(result).toEqual({ confirmed: 1, failed: 1 });
    });
  });

  describe('confirmOrder', () => {
    it('should confirm a single order', async () => {
      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: [
          {
            id: 'order-1',
            supplier_id: supplierId,
            location_id: 'loc-1',
            items: [],
            status: 'confirmed' as const,
            confirmed_at: new Date(),
            deliver_by: null,
            shipped_at: null,
            delivered_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        invalidIds: [],
      });

      const result = await service.confirmOrder(supplierId, 'order-1');
      expect(result).toEqual({ confirmed: true });
    });

    it('should throw ForbiddenException when order not found', async () => {
      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: [],
        invalidIds: ['order-bad'],
      });

      await expect(
        service.confirmOrder(supplierId, 'order-bad'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTrends', () => {
    it('should return aggregated trend data', async () => {
      const items = [
        {
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 5,
          reorder_threshold: 10,
          is_86d: false,
          tenant_id: 'loc-1',
        },
        {
          id: 'item-2',
          item_name: 'Beef',
          current_quantity: 50,
          reorder_threshold: 10,
          is_86d: false,
          tenant_id: 'loc-1',
        },
      ];

      const items86d = [
        {
          id: 'item-3',
          item_name: 'Tuna',
          current_quantity: 0,
          is_86d: true,
          tenant_id: 'loc-1',
        },
      ];

      repository.getInventoryForLinkedRestaurants.mockResolvedValue(items);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue(items86d);

      const result = await service.getTrends(supplierId);

      expect(result.inventoryLevels).toHaveLength(2);
      expect(result.frequently86d).toHaveLength(1);
      // Salmon: quantity 5, threshold 10, 5 <= 10*1.5=15, so trending
      expect(result.trendingUp).toHaveLength(1);
      expect(result.trendingUp[0].item_name).toBe('Salmon');
    });

    it('should filter by locationId when provided', async () => {
      repository.getInventoryForLinkedRestaurants.mockResolvedValue([]);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue([]);

      await service.getTrends(supplierId, 'loc-1');

      expect(repository.getInventoryForLinkedRestaurants).toHaveBeenCalledWith(
        supplierId,
        'loc-1',
      );
    });
  });

  describe('batchRouteOrders', () => {
    it('should route orders with delivery times', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.findSupplierOrdersBySupplier.mockResolvedValue(orders);
      repository.batchRouteOrders.mockResolvedValue([
        {
          orderId: 'order-1',
          deliveryTime: '2026-03-29T10:00:00Z',
          status: 'shipped',
        },
      ]);

      const result = await service.batchRouteOrders(supplierId, [
        { orderIds: ['order-1'], deliveryTime: '2026-03-29T10:00:00Z' },
      ]);

      expect(result.routed).toBe(1);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SUPPLIER_EVENTS.ORDER_UPDATED,
        }),
      );
    });

    it('should throw ForbiddenException when orders do not belong to supplier', async () => {
      repository.findSupplierOrdersBySupplier.mockResolvedValue([]);

      await expect(
        service.batchRouteOrders(supplierId, [
          { orderIds: ['order-999'], deliveryTime: '2026-03-29T10:00:00Z' },
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle multiple groups with multiple orders each', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'order-2',
          supplier_id: supplierId,
          location_id: 'loc-2',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'order-3',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.findSupplierOrdersBySupplier.mockResolvedValue(orders);
      repository.batchRouteOrders.mockResolvedValue([
        {
          orderId: 'order-1',
          deliveryTime: '2026-03-29T10:00:00Z',
          status: 'shipped',
        },
        {
          orderId: 'order-2',
          deliveryTime: '2026-03-29T14:00:00Z',
          status: 'shipped',
        },
        {
          orderId: 'order-3',
          deliveryTime: '2026-03-29T14:00:00Z',
          status: 'shipped',
        },
      ]);

      const result = await service.batchRouteOrders(supplierId, [
        { orderIds: ['order-1'], deliveryTime: '2026-03-29T10:00:00Z' },
        {
          orderIds: ['order-2', 'order-3'],
          deliveryTime: '2026-03-29T14:00:00Z',
        },
      ]);

      expect(result.routed).toBe(3);
      expect(eventBus.emit).toHaveBeenCalledTimes(3);
    });

    it('should throw ForbiddenException when batch contains mixed valid and invalid orders', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.findSupplierOrdersBySupplier.mockResolvedValue(orders);

      await expect(
        service.batchRouteOrders(supplierId, [
          {
            orderIds: ['order-1', 'order-invalid'],
            deliveryTime: '2026-03-29T10:00:00Z',
          },
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not emit events for routed orders that are not found in supplier orders', async () => {
      const orders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          location_id: 'loc-1',
          items: [],
          status: 'confirmed' as const,
          deliver_by: null,
          confirmed_at: new Date(),
          shipped_at: null,
          delivered_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      repository.findSupplierOrdersBySupplier.mockResolvedValue(orders);
      // Simulate a result with an order ID that doesn't match any supplier order
      repository.batchRouteOrders.mockResolvedValue([
        {
          orderId: 'order-1',
          deliveryTime: '2026-03-29T10:00:00Z',
          status: 'shipped',
        },
        {
          orderId: 'order-phantom',
          deliveryTime: '2026-03-29T10:00:00Z',
          status: 'shipped',
        },
      ]);

      const result = await service.batchRouteOrders(supplierId, [
        { orderIds: ['order-1'], deliveryTime: '2026-03-29T10:00:00Z' },
      ]);

      expect(result.routed).toBe(2);
      // Only one event emitted because order-phantom is not found in orders list
      expect(eventBus.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveSupplierOrdersForLocation', () => {
    it('should delegate to repository', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          items: [],
          status: 'pending',
          supplier_name: 'Fresh Foods',
        },
      ];
      repository.findActiveSupplierOrdersForLocation.mockResolvedValue(
        mockOrders as any,
      );

      const result = await service.getActiveSupplierOrdersForLocation('loc-1');

      expect(
        repository.findActiveSupplierOrdersForLocation,
      ).toHaveBeenCalledWith('loc-1');
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no active orders', async () => {
      repository.findActiveSupplierOrdersForLocation.mockResolvedValue([]);

      const result = await service.getActiveSupplierOrdersForLocation('loc-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDemandData - edge cases', () => {
    it('should handle multiple linked restaurants with threshold items', async () => {
      repository.countPendingOrdersBySupplier.mockResolvedValue(1);
      repository.getLinkedRestaurants.mockResolvedValue([
        {
          linkId: 'link-1',
          locationId: 'loc-1',
          locationName: 'Kitchen A',
          address: null,
          organizationId: 'org-1',
        },
        {
          linkId: 'link-2',
          locationId: 'loc-2',
          locationName: 'Kitchen B',
          address: null,
          organizationId: 'org-1',
        },
      ]);
      repository.getApproachingThresholdItems.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 2,
          reorder_threshold: 5,
          tenant_id: 'loc-1',
        },
        {
          id: 'item-2',
          item_name: 'Tuna',
          current_quantity: 1,
          reorder_threshold: 3,
          tenant_id: 'loc-2',
        },
      ]);

      const result = await service.getDemandData(supplierId);

      expect(result.pendingReordersCount).toBe(1);
      expect(result.approachingThresholdItems).toHaveLength(2);
      expect(repository.getApproachingThresholdItems).toHaveBeenCalledWith([
        'loc-1',
        'loc-2',
      ]);
    });
  });

  describe('getTrends - edge cases', () => {
    it('should not include items with zero quantity in trendingUp', async () => {
      const items = [
        {
          id: 'item-1',
          item_name: 'Out of stock',
          current_quantity: 0,
          reorder_threshold: 10,
          is_86d: true,
          tenant_id: 'loc-1',
        },
      ];
      repository.getInventoryForLinkedRestaurants.mockResolvedValue(items);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue([]);

      const result = await service.getTrends(supplierId);

      expect(result.trendingUp).toHaveLength(0);
    });

    it('should not include items well above threshold in trendingUp', async () => {
      const items = [
        {
          id: 'item-1',
          item_name: 'Well stocked',
          current_quantity: 100,
          reorder_threshold: 10,
          is_86d: false,
          tenant_id: 'loc-1',
        },
      ];
      repository.getInventoryForLinkedRestaurants.mockResolvedValue(items);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue([]);

      const result = await service.getTrends(supplierId);

      // 100 > 10*1.5=15, so not trending
      expect(result.trendingUp).toHaveLength(0);
    });

    it('should include item exactly at 1.5x threshold in trendingUp', async () => {
      const items = [
        {
          id: 'item-1',
          item_name: 'Borderline',
          current_quantity: 15,
          reorder_threshold: 10,
          is_86d: false,
          tenant_id: 'loc-1',
        },
      ];
      repository.getInventoryForLinkedRestaurants.mockResolvedValue(items);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue([]);

      const result = await service.getTrends(supplierId);

      // 15 <= 10*1.5=15, so trending
      expect(result.trendingUp).toHaveLength(1);
    });

    it('should return empty arrays when no inventory data', async () => {
      repository.getInventoryForLinkedRestaurants.mockResolvedValue([]);
      repository.get86dItemsForLinkedRestaurants.mockResolvedValue([]);

      const result = await service.getTrends(supplierId);

      expect(result.inventoryLevels).toEqual([]);
      expect(result.trendingUp).toEqual([]);
      expect(result.frequently86d).toEqual([]);
    });
  });

  describe('batchConfirmOrders - edge cases', () => {
    it('should handle empty confirmed list with empty invalidIds (no-op)', async () => {
      repository.batchConfirmOrders.mockResolvedValue({
        confirmed: [],
        invalidIds: [],
      });

      const result = await service.batchConfirmOrders(supplierId, []);

      expect(result).toEqual({ confirmed: 0, failed: 0 });
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('getSupplierOrders - edge cases', () => {
    it('should return empty array when supplier has no orders', async () => {
      repository.findSupplierOrdersBySupplier.mockResolvedValue([]);

      const result = await service.getSupplierOrders(supplierId);

      expect(result).toEqual([]);
    });

    it('should return multiple orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          supplier_id: supplierId,
          status: 'pending',
          items: [],
        },
        {
          id: 'order-2',
          supplier_id: supplierId,
          status: 'confirmed',
          items: [],
        },
        {
          id: 'order-3',
          supplier_id: supplierId,
          status: 'shipped',
          items: [],
        },
      ];
      repository.findSupplierOrdersBySupplier.mockResolvedValue(
        mockOrders as any,
      );

      const result = await service.getSupplierOrders(supplierId);

      expect(result).toHaveLength(3);
    });
  });
});
