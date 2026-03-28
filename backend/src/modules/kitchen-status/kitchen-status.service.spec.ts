import { Test, TestingModule } from '@nestjs/testing';
import { KitchenStatusService } from './kitchen-status.service';
import { KitchenStatusRepository } from './kitchen-status.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { INVENTORY_EVENTS } from '@foodtech/shared-types';

describe('KitchenStatusService', () => {
  let service: KitchenStatusService;
  let repository: jest.Mocked<KitchenStatusRepository>;
  let eventBus: jest.Mocked<EventBusService>;

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitchenStatusService,
        {
          provide: KitchenStatusRepository,
          useValue: {
            createItem: jest.fn().mockResolvedValue({}),
            findAllByTenant: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            updateQuantity: jest.fn().mockResolvedValue(undefined),
            decrementQuantity: jest.fn().mockResolvedValue(undefined),
            find86dItems: jest.fn().mockResolvedValue([]),
            findByNames: jest.fn().mockResolvedValue([]),
            createChecklist: jest.fn().mockResolvedValue({}),
            findChecklistByStation: jest.fn().mockResolvedValue(null),
            findChecklistItems: jest.fn().mockResolvedValue([]),
            addChecklistItem: jest.fn().mockResolvedValue({}),
            toggleChecklistItem: jest.fn().mockResolvedValue(undefined),
            deleteChecklistItem: jest.fn().mockResolvedValue(undefined),
            getActiveTicketCountByStation: jest.fn().mockResolvedValue(0),
            getOldestTicketAge: jest.fn().mockResolvedValue(null),
            getAllStationsWithStatus: jest.fn().mockResolvedValue([]),
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

    service = module.get(KitchenStatusService);
    repository = module.get(KitchenStatusRepository);
    eventBus = module.get(EventBusService);
  });

  describe('createItem', () => {
    it('should create an inventory item', async () => {
      const dto = {
        itemName: 'Salmon',
        currentQuantity: 20,
        reorderThreshold: 5,
      };
      repository.createItem.mockResolvedValue({
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 20,
        reorder_threshold: 5,
        is_86d: false,
        tenant_id: tenantId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createItem(tenantId, dto);

      expect(repository.createItem).toHaveBeenCalledWith(tenantId, {
        item_name: 'Salmon',
        current_quantity: 20,
        reorder_threshold: 5,
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 20,
          reorder_threshold: 5,
          is_86d: false,
          tenant_id: tenantId,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all items for tenant', async () => {
      const items = [{ id: 'item-1', item_name: 'Salmon' }];
      repository.findAllByTenant.mockResolvedValue([
        {
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 20,
          reorder_threshold: 5,
          is_86d: false,
          tenant_id: tenantId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await service.findAll(tenantId);
      expect(result).toEqual([
        expect.objectContaining({
          id: 'item-1',
          item_name: 'Salmon',
          current_quantity: 20,
          reorder_threshold: 5,
          is_86d: false,
          tenant_id: tenantId,
        }),
      ]);
    });
  });

  describe('findById', () => {
    it('should return a single item', async () => {
      const item = { id: 'item-1', item_name: 'Salmon' };
      repository.findById.mockResolvedValue(item as any);

      const result = await service.findById(tenantId, 'item-1');
      expect(result).toEqual(item);
    });
  });

  describe('updateItem', () => {
    it('should update quantity and emit level changed event', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 10,
        reorder_threshold: 5,
        is_86d: false,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      const result = await service.updateItem(tenantId, 'item-1', {
        currentQuantity: 10,
      });

      expect(repository.updateQuantity).toHaveBeenCalledWith(
        tenantId,
        'item-1',
        10,
      );
      expect(result).toEqual(updated);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event: INVENTORY_EVENTS.LEVEL_CHANGED }),
      );
    });

    it('should return existing item when no quantity update provided', async () => {
      const item = { id: 'item-1', item_name: 'Salmon' };
      repository.findById.mockResolvedValue(item as any);

      const result = await service.updateItem(tenantId, 'item-1', {});
      expect(result).toEqual(item);
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('86d auto-detection', () => {
    it('should emit 86d event when item quantity reaches zero', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 0,
        reorder_threshold: 5,
        is_86d: true,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      await service.updateItem(tenantId, 'item-1', { currentQuantity: 0 });

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event: INVENTORY_EVENTS.EIGHTY_SIXED }),
      );
    });

    it('should NOT emit 86d event when quantity is above zero', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 5,
        reorder_threshold: 3,
        is_86d: false,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      await service.updateItem(tenantId, 'item-1', { currentQuantity: 5 });

      const calls = eventBus.emit.mock.calls;
      const eightySixedCalls = calls.filter(
        (c) => c[0].event === INVENTORY_EVENTS.EIGHTY_SIXED,
      );
      expect(eightySixedCalls).toHaveLength(0);
    });
  });

  describe('reorder threshold', () => {
    it('should emit reorder event when quantity drops below threshold', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 3,
        reorder_threshold: 5,
        is_86d: false,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      await service.updateItem(tenantId, 'item-1', { currentQuantity: 3 });

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'inventory.reorder.triggered' }),
      );
    });

    it('should NOT emit reorder event when quantity is above threshold', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 10,
        reorder_threshold: 5,
        is_86d: false,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      await service.updateItem(tenantId, 'item-1', { currentQuantity: 10 });

      const calls = eventBus.emit.mock.calls;
      const reorderCalls = calls.filter(
        (c) => c[0].event === 'inventory.reorder.triggered',
      );
      expect(reorderCalls).toHaveLength(0);
    });

    it('should NOT emit reorder event when item is 86d (quantity is 0)', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 0,
        reorder_threshold: 5,
        is_86d: true,
      };
      repository.updateQuantity.mockResolvedValue(updated as any);

      await service.updateItem(tenantId, 'item-1', { currentQuantity: 0 });

      const calls = eventBus.emit.mock.calls;
      const reorderCalls = calls.filter(
        (c) => c[0].event === 'inventory.reorder.triggered',
      );
      expect(reorderCalls).toHaveLength(0);
    });
  });

  describe('decrementItem', () => {
    it('should decrement and emit events', async () => {
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 2,
        reorder_threshold: 5,
        is_86d: false,
      };
      repository.decrementQuantity.mockResolvedValue(updated as any);

      const result = await service.decrementItem(tenantId, 'item-1', 3);

      expect(repository.decrementQuantity).toHaveBeenCalledWith(
        tenantId,
        'item-1',
        3,
      );
      expect(result).toEqual(updated);
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should not emit events when item not found', async () => {
      repository.decrementQuantity.mockResolvedValue(null);

      const result = await service.decrementItem(tenantId, 'item-1', 3);

      expect(result).toBeNull();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('find86dItems', () => {
    it('should return 86d items for tenant', async () => {
      const items = [{ id: 'item-1', is_86d: true }];
      repository.find86dItems.mockResolvedValue(items as any);

      const result = await service.find86dItems(tenantId);
      expect(result).toEqual(items);
    });
  });

  describe('calculateStatus', () => {
    it('should return green for 0-3 tickets below warning threshold', () => {
      expect(service.calculateStatus(0, 0)).toBe('green');
      expect(service.calculateStatus(3, 2 * 60 * 1000)).toBe('green');
    });

    it('should return yellow for 4-6 tickets', () => {
      expect(service.calculateStatus(4, 0)).toBe('yellow');
      expect(service.calculateStatus(6, 0)).toBe('yellow');
    });

    it('should return yellow when any ticket exceeds warning threshold', () => {
      expect(service.calculateStatus(2, 5 * 60 * 1000)).toBe('yellow');
    });

    it('should return red for 7+ tickets', () => {
      expect(service.calculateStatus(7, 0)).toBe('red');
      expect(service.calculateStatus(10, 0)).toBe('red');
    });

    it('should return red when any ticket exceeds critical threshold', () => {
      expect(service.calculateStatus(1, 8 * 60 * 1000)).toBe('red');
    });
  });

  describe('toggleChecklistItem', () => {
    it('should emit kitchen.status.changed when all items complete', async () => {
      repository.toggleChecklistItem.mockResolvedValue({
        id: 'ci-1',
        is_completed: true,
      } as any);
      repository.findChecklistItems.mockResolvedValue([
        { id: 'ci-1', is_completed: true },
        { id: 'ci-2', is_completed: true },
      ] as any);

      const result = await service.toggleChecklistItem(
        tenantId,
        'checklist-1',
        'ci-1',
        true,
        'user-1',
      );

      expect(result?.allComplete).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'kitchen.status.changed',
          payload: expect.objectContaining({ status: 'ready' }),
        }),
      );
    });

    it('should NOT emit event when not all items complete', async () => {
      repository.toggleChecklistItem.mockResolvedValue({
        id: 'ci-1',
        is_completed: true,
      } as any);
      repository.findChecklistItems.mockResolvedValue([
        { id: 'ci-1', is_completed: true },
        { id: 'ci-2', is_completed: false },
      ] as any);

      const result = await service.toggleChecklistItem(
        tenantId,
        'checklist-1',
        'ci-1',
        true,
      );

      expect(result?.allComplete).toBe(false);
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
});
