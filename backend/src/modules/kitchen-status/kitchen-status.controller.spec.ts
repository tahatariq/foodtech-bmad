import { Test, TestingModule } from '@nestjs/testing';
import { KitchenStatusController } from './kitchen-status.controller';
import { KitchenStatusService } from './kitchen-status.service';

describe('KitchenStatusController', () => {
  let controller: KitchenStatusController;
  let service: jest.Mocked<KitchenStatusService>;

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KitchenStatusController],
      providers: [
        {
          provide: KitchenStatusService,
          useValue: {
            createItem: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            find86dItems: jest.fn(),
            updateItem: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(KitchenStatusController);
    service = module.get(KitchenStatusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createItem', () => {
    it('should call service.createItem with tenantId and dto', async () => {
      const dto = {
        itemName: 'Salmon',
        currentQuantity: 20,
        reorderThreshold: 5,
      };
      const created = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 20,
        reorder_threshold: 5,
        is_86d: false,
        tenant_id: tenantId,
      };
      service.createItem.mockResolvedValue(created as any);

      const result = await controller.createItem(tenantId, dto);

      expect(service.createItem).toHaveBeenCalledWith(tenantId, dto);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return all inventory items for tenant', async () => {
      const items = [
        { id: 'item-1', item_name: 'Salmon' },
        { id: 'item-2', item_name: 'Rice' },
      ];
      service.findAll.mockResolvedValue(items as any);

      const result = await controller.findAll(tenantId);

      expect(service.findAll).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(items);
    });

    it('should return empty array when no items exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('find86d', () => {
    it('should return 86d items for tenant', async () => {
      const items = [{ id: 'item-1', item_name: 'Salmon', is_86d: true }];
      service.find86dItems.mockResolvedValue(items as any);

      const result = await controller.find86d(tenantId);

      expect(service.find86dItems).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(items);
    });

    it('should return empty array when no 86d items', async () => {
      service.find86dItems.mockResolvedValue([]);

      const result = await controller.find86d(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single item by id', async () => {
      const item = { id: 'item-1', item_name: 'Salmon' };
      service.findById.mockResolvedValue(item as any);

      const result = await controller.findOne(tenantId, 'item-1');

      expect(service.findById).toHaveBeenCalledWith(tenantId, 'item-1');
      expect(result).toEqual(item);
    });

    it('should return null when item not found', async () => {
      service.findById.mockResolvedValue(null as any);

      const result = await controller.findOne(tenantId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('should call service.updateItem with correct params', async () => {
      const dto = { currentQuantity: 10 };
      const updated = {
        id: 'item-1',
        item_name: 'Salmon',
        current_quantity: 10,
      };
      service.updateItem.mockResolvedValue(updated as any);

      const result = await controller.updateItem(tenantId, 'item-1', dto);

      expect(service.updateItem).toHaveBeenCalledWith(tenantId, 'item-1', dto);
      expect(result).toEqual(updated);
    });

    it('should pass empty dto when no fields provided', async () => {
      const dto = {};
      const existing = { id: 'item-1', item_name: 'Salmon' };
      service.updateItem.mockResolvedValue(existing as any);

      const result = await controller.updateItem(tenantId, 'item-1', dto);

      expect(service.updateItem).toHaveBeenCalledWith(tenantId, 'item-1', dto);
      expect(result).toEqual(existing);
    });
  });
});
