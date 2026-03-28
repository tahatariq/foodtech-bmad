import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { type DrizzleDB } from '../../database/database.provider';

describe('DeliveryService', () => {
  let service: DeliveryService;

  function createMockDb(options: {
    locationRows?: unknown[];
    orderRows?: unknown[];
    itemRows?: unknown[];
    updateFn?: jest.Mock;
  }): DrizzleDB {
    const {
      locationRows = [],
      orderRows = [],
      itemRows = [],
      updateFn = jest.fn(),
    } = options;

    let selectCall = 0;
    const chain: Record<string, jest.Mock> = {
      select: jest.fn(() => {
        selectCall++;
        return chain;
      }),
      from: jest.fn().mockReturnThis(),
      where: jest.fn((/* _condition */) => {
        if (selectCall === 1) return chain; // location query -> needs limit
        if (selectCall === 2) return Promise.resolve(orderRows); // orders query
        return Promise.resolve(itemRows); // items query
      }),
      limit: jest.fn(() => Promise.resolve(locationRows)),
      update: jest.fn(() => chain),
      set: jest.fn(() => chain),
    };

    // For update().set().where() chain
    const updateChain: Record<string, jest.Mock> = {
      set: jest.fn(() => updateChain),
      where: updateFn,
    };
    chain.update = jest.fn(() => updateChain);

    return chain as unknown as DrizzleDB;
  }

  describe('validateApiKey', () => {
    it('should return null for invalid API key', async () => {
      service = new DeliveryService(createMockDb({ locationRows: [] }));
      const result = await service.validateApiKey('invalid-key');
      expect(result).toBeNull();
    });

    it('should return tenant ID for valid API key', async () => {
      service = new DeliveryService(
        createMockDb({
          locationRows: [{ id: 'tenant-1', api_key: 'valid-key' }],
        }),
      );
      const result = await service.validateApiKey('valid-key');
      expect(result).toBe('tenant-1');
    });
  });

  describe('getDeliveryOrders', () => {
    it('should return orders sorted with served first', async () => {
      const mockOrders = [
        {
          id: 'o1',
          order_number: 'ORD-001',
          status: 'preparing',
          created_at: new Date(),
        },
        {
          id: 'o2',
          order_number: 'ORD-002',
          status: 'served',
          created_at: new Date(),
        },
      ];
      const mockItems = [{ item_name: 'Burger', quantity: 1 }];

      // Custom mock that returns orders on second select, items on third
      let selectCall = 0;
      const chain: Record<string, jest.Mock> = {
        select: jest.fn(() => {
          selectCall++;
          return chain;
        }),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(() => {
          if (selectCall === 1) return Promise.resolve(mockOrders);
          return Promise.resolve(mockItems);
        }),
      };

      service = new DeliveryService(chain as unknown as DrizzleDB);
      const result = await service.getDeliveryOrders('tenant-1');

      expect(result.length).toBe(2);
      expect(result[0].status).toBe('served');
      expect(result[0].etaMinutes).toBe(0);
      expect(result[1].status).toBe('preparing');
      expect(result[1].etaMinutes).toBe(8);
    });
  });

  describe('pickupOrder', () => {
    it('should update order status to completed', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);

      // Need: select().from().where().limit() for order lookup, then update
      let selectCall = 0;
      const updateChain: Record<string, jest.Mock> = {
        set: jest.fn(() => updateChain),
        where: updateFn,
      };
      const chain: Record<string, jest.Mock> = {
        select: jest.fn(() => {
          selectCall++;
          return chain;
        }),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn(() =>
          Promise.resolve([
            {
              id: 'order-1',
              order_number: 'ORD-001',
              status: 'served',
              tenant_id: 'tenant-1',
            },
          ]),
        ),
        update: jest.fn(() => updateChain),
      };

      service = new DeliveryService(chain as unknown as DrizzleDB);
      const result = await service.pickupOrder('tenant-1', 'order-1');

      expect(result.status).toBe('completed');
      expect(updateFn).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent order', async () => {
      const chain: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      service = new DeliveryService(chain as unknown as DrizzleDB);
      await expect(
        service.pickupOrder('tenant-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for non-served order', async () => {
      const chain: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'order-1',
            order_number: 'ORD-001',
            status: 'preparing',
            tenant_id: 'tenant-1',
          },
        ]),
      };

      service = new DeliveryService(chain as unknown as DrizzleDB);
      await expect(service.pickupOrder('tenant-1', 'order-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
