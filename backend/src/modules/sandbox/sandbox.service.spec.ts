import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SandboxService } from './sandbox.service';

describe('SandboxService', () => {
  let service: SandboxService;
  let mockDb: {
    transaction: jest.Mock;
    select: jest.Mock;
    delete: jest.Mock;
  };
  let mockTx: {
    insert: jest.Mock;
  };

  beforeEach(() => {
    mockTx = {
      insert: jest.fn(),
    };

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
        ),
      select: jest.fn(),
      delete: jest.fn(),
    };

    service = new SandboxService(mockDb as never);
  });

  describe('provisionSandbox', () => {
    it('should create sandbox with sample data and return credentials', async () => {
      let insertCallCount = 0;
      mockTx.insert.mockImplementation(() => ({
        values: jest.fn().mockImplementation(() => {
          insertCallCount++;
          if (insertCallCount === 1) {
            // org insert
            return {
              returning: jest
                .fn()
                .mockResolvedValue([{ id: 'org-1', name: 'Sandbox-test' }]),
            };
          }
          if (insertCallCount === 2) {
            // location insert
            return {
              returning: jest.fn().mockResolvedValue([
                {
                  id: 'loc-1',
                  organization_id: 'org-1',
                  name: 'Sandbox-test',
                  is_sandbox: true,
                },
              ]),
            };
          }
          // stations, order stages, inventory, api keys - no returning needed
          return { returning: jest.fn().mockResolvedValue([{ id: 'key-1' }]) };
        }),
      }));

      const result = await service.provisionSandbox();

      expect(result.tenantId).toBe('loc-1');
      expect(result.apiKey).toMatch(/^ft_key_/);
      expect(result.apiSecret).toBeDefined();
      expect(result.endpoints.orders).toBe('/api/v1/orders');
      expect(result.endpoints.webhooks).toContain('/api/v1/integrations/');
    });

    it('should set is_sandbox=true on created location', async () => {
      let insertCallCount = 0;
      const locationValues = jest.fn();

      mockTx.insert.mockImplementation(() => ({
        values: jest.fn().mockImplementation((vals: unknown) => {
          insertCallCount++;
          if (insertCallCount === 2) {
            locationValues(vals);
          }
          if (insertCallCount === 1) {
            return {
              returning: jest.fn().mockResolvedValue([{ id: 'org-1' }]),
            };
          }
          if (insertCallCount === 2) {
            return {
              returning: jest
                .fn()
                .mockResolvedValue([{ id: 'loc-1', is_sandbox: true }]),
            };
          }
          return { returning: jest.fn().mockResolvedValue([{ id: 'x' }]) };
        }),
      }));

      await service.provisionSandbox();

      expect(locationValues).toHaveBeenCalledWith(
        expect.objectContaining({ is_sandbox: true }),
      );
    });
  });

  describe('deleteSandbox', () => {
    it('should refuse to delete non-sandbox tenant', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([
              { id: 'loc-1', is_sandbox: false, name: 'Real Tenant' },
            ]),
        }),
      });

      await expect(service.deleteSandbox('loc-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw not found for non-existent tenant', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteSandbox('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete sandbox tenant and all associated data', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValue([
              { id: 'loc-1', is_sandbox: true, name: 'Sandbox-test' },
            ]),
        }),
      });

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.deleteSandbox('loc-1');

      expect(result.deleted).toBe(true);
      expect(result.tenantId).toBe('loc-1');
      // 8 delete calls: orderItems, orders, inventoryItems, orderStages, stations, webhookSubscriptions, apiKeys, location
      expect(mockDb.delete).toHaveBeenCalledTimes(8);
    });
  });

  describe('getSandboxStatus', () => {
    it('should return correct status data', async () => {
      let selectCallCount = 0;
      mockDb.select.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // location query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                {
                  id: 'loc-1',
                  name: 'Sandbox-test',
                  is_sandbox: true,
                  last_activity_at: new Date('2025-01-01'),
                  created_at: new Date('2025-01-01'),
                },
              ]),
            }),
          };
        }
        // order count query
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ count: 5 }]),
          }),
        };
      });

      const result = await service.getSandboxStatus('loc-1');

      expect(result.tenantId).toBe('loc-1');
      expect(result.is_sandbox).toBe(true);
      expect(result.orderCount).toBe(5);
    });

    it('should throw not found for non-sandbox tenant', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.getSandboxStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
