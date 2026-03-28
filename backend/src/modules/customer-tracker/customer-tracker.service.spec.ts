import { CustomerTrackerService } from './customer-tracker.service';
import { type DrizzleDB } from '../../database/database.provider';

describe('CustomerTrackerService', () => {
  let service: CustomerTrackerService;

  function createMockDb(
    orderRows: unknown[],
    itemRows: unknown[] = [],
  ): DrizzleDB {
    let callCount = 0;
    const chain: Record<string, jest.Mock> = {
      select: jest.fn(() => {
        callCount++;
        return chain;
      }),
      from: jest.fn().mockReturnThis(),
      where: jest.fn(() => {
        // Second select chain (items) has no limit - resolve directly
        if (callCount >= 2) return Promise.resolve(itemRows);
        return chain;
      }),
      limit: jest.fn().mockResolvedValue(orderRows),
    };
    return chain as unknown as DrizzleDB;
  }

  describe('generateTrackingToken', () => {
    beforeEach(() => {
      service = new CustomerTrackerService(createMockDb([]));
    });

    it('should return a 64-character hex string', () => {
      const token = service.generateTrackingToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return unique tokens on each call', () => {
      const token1 = service.generateTrackingToken();
      const token2 = service.generateTrackingToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('findOrderByToken', () => {
    it('should return null for non-existent token', async () => {
      service = new CustomerTrackerService(createMockDb([]));
      const result = await service.findOrderByToken('nonexistent-token');
      expect(result).toBeNull();
    });

    it('should return { expired: true } for expired token', async () => {
      const expiredDate = new Date(Date.now() - 60000);
      service = new CustomerTrackerService(
        createMockDb([
          {
            id: 'order-1',
            order_number: 'ORD-001',
            status: 'received',
            tracking_token: 'some-token',
            tracking_token_expires_at: expiredDate,
            created_at: new Date(),
          },
        ]),
      );

      const result = await service.findOrderByToken('some-token');
      expect(result).toEqual({ expired: true });
    });

    it('should return order data for valid token', async () => {
      const futureDate = new Date(Date.now() + 60000 * 60);
      const items = [
        {
          item_name: 'Burger',
          stage: 'received',
          quantity: 2,
          order_id: 'order-1',
        },
      ];

      service = new CustomerTrackerService(
        createMockDb(
          [
            {
              id: 'order-1',
              order_number: 'ORD-001',
              status: 'received',
              tracking_token: 'valid-token',
              tracking_token_expires_at: futureDate,
              created_at: new Date(),
            },
          ],
          items,
        ),
      );

      const result = await service.findOrderByToken('valid-token');
      expect(result).toMatchObject({
        expired: false,
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        status: 'received',
        items: [{ itemName: 'Burger', stage: 'received', quantity: 2 }],
      });
    });
  });
});
