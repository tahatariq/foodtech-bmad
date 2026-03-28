import { Test, TestingModule } from '@nestjs/testing';
import { AutoReorderService, ReorderPayload } from './auto-reorder.service';
import { SupplierRepository } from './supplier.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';

describe('AutoReorderService', () => {
  let service: AutoReorderService;
  let repository: jest.Mocked<SupplierRepository>;
  let eventBus: jest.Mocked<EventBusService>;

  const tenantId = 'loc-1';
  const reorderPayload: ReorderPayload = {
    itemId: 'item-1',
    itemName: 'Salmon',
    currentQuantity: 3,
    reorderThreshold: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoReorderService,
        {
          provide: SupplierRepository,
          useValue: {
            findPendingOrderForItem: jest.fn().mockResolvedValue(null),
            findLinkedSupplierForLocation: jest.fn().mockResolvedValue(null),
            createSupplierOrder: jest.fn().mockResolvedValue({
              id: 'order-1',
              supplier_id: 'supplier-1',
              location_id: tenantId,
              status: 'pending',
              items: [],
            }),
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

    service = module.get(AutoReorderService);
    repository = module.get(SupplierRepository);
    eventBus = module.get(EventBusService);
  });

  describe('handleReorderCheck', () => {
    it('should create a supplier order when threshold is reached', async () => {
      repository.findPendingOrderForItem.mockResolvedValue(null);
      repository.findLinkedSupplierForLocation.mockResolvedValue({
        supplierId: 'supplier-1',
        linkId: 'link-1',
      });
      repository.createSupplierOrder.mockResolvedValue({
        id: 'order-1',
        supplier_id: 'supplier-1',
        location_id: tenantId,
        status: 'pending',
        items: [
          {
            itemName: 'Salmon',
            quantity: 3,
            reorderThreshold: 5,
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
        deliver_by: null,
        confirmed_at: null,
        shipped_at: null,
        delivered_at: null,
      });

      const result = await service.handleReorderCheck(tenantId, reorderPayload);

      expect(result).not.toBeNull();
      expect(repository.createSupplierOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier_id: 'supplier-1',
          location_id: tenantId,
          status: 'pending',
        }),
      );
    });

    it('should emit reorder event when order is created', async () => {
      repository.findPendingOrderForItem.mockResolvedValue(null);
      repository.findLinkedSupplierForLocation.mockResolvedValue({
        supplierId: 'supplier-1',
        linkId: 'link-1',
      });
      repository.createSupplierOrder.mockResolvedValue({
        id: 'order-1',
        supplier_id: 'supplier-1',
        location_id: tenantId,
        status: 'pending',
        items: [],
        created_at: new Date(),
        updated_at: new Date(),
        deliver_by: null,
        confirmed_at: null,
        shipped_at: null,
        delivered_at: null,
      });

      await service.handleReorderCheck(tenantId, reorderPayload);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'inventory.reorder.triggered',
          payload: expect.objectContaining({
            orderId: 'order-1',
            supplierId: 'supplier-1',
            itemName: 'Salmon',
            locationId: tenantId,
          }),
        }),
      );
    });

    it('should skip if pending order already exists (duplicate prevention)', async () => {
      repository.findPendingOrderForItem.mockResolvedValue({
        id: 'existing-order',
        status: 'pending',
      } as any);

      const result = await service.handleReorderCheck(tenantId, reorderPayload);

      expect(result).toBeNull();
      expect(repository.createSupplierOrder).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should skip if no supplier is linked to the location', async () => {
      repository.findPendingOrderForItem.mockResolvedValue(null);
      repository.findLinkedSupplierForLocation.mockResolvedValue(null as any);

      const result = await service.handleReorderCheck(tenantId, reorderPayload);

      expect(result).toBeNull();
      expect(repository.createSupplierOrder).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
});
