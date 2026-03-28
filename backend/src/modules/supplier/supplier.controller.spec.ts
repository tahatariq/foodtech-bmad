import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SupplierRepository } from './supplier.repository';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('SupplierController', () => {
  let controller: SupplierController;
  let service: jest.Mocked<SupplierService>;
  let repository: jest.Mocked<SupplierRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const supplierId = 'supplier-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierController],
      providers: [
        {
          provide: SupplierService,
          useValue: {
            getLinkedRestaurants: jest.fn().mockResolvedValue([]),
            getDemandData: jest.fn().mockResolvedValue({
              pendingReordersCount: 0,
              approachingThresholdItems: [],
            }),
            getSupplierOrders: jest.fn().mockResolvedValue([]),
            batchConfirmOrders: jest
              .fn()
              .mockResolvedValue({ confirmed: 0, failed: 0 }),
            batchRouteOrders: jest
              .fn()
              .mockResolvedValue({ routed: 0, groups: [] }),
            confirmOrder: jest.fn().mockResolvedValue({ confirmed: true }),
            getTrends: jest.fn().mockResolvedValue({
              inventoryLevels: [],
              trendingUp: [],
              frequently86d: [],
            }),
            getActiveSupplierOrdersForLocation: jest.fn().mockResolvedValue([]),
            createLink: jest.fn().mockResolvedValue({}),
            deleteLink: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SupplierRepository,
          useValue: {
            findSupplierByEmail: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    controller = module.get(SupplierController);
    service = module.get(SupplierService);
    repository = module.get(SupplierRepository);
    jwtService = module.get(JwtService);
  });

  // --- Auth ---

  describe('supplierLogin', () => {
    it('should return access token on valid credentials', async () => {
      repository.findSupplierByEmail.mockResolvedValue({
        id: supplierId,
        email: 'supplier@example.com',
        password_hash: 'hashed-pw',
        name: 'Test Supplier',
        phone: null,
        webhook_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await controller.supplierLogin({
        email: 'supplier@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        supplierId,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: supplierId,
          supplierId,
          role: 'supplier',
          email: 'supplier@example.com',
        }),
      );
    });

    it('should throw UnauthorizedException when email not found', async () => {
      repository.findSupplierByEmail.mockResolvedValue(null as any);

      await expect(
        controller.supplierLogin({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      repository.findSupplierByEmail.mockResolvedValue({
        id: supplierId,
        email: 'supplier@example.com',
        password_hash: 'hashed-pw',
        name: 'Test Supplier',
        phone: null,
        webhook_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        controller.supplierLogin({
          email: 'supplier@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when supplier has no password_hash', async () => {
      repository.findSupplierByEmail.mockResolvedValue({
        id: supplierId,
        email: 'supplier@example.com',
        password_hash: null,
        name: 'Test Supplier',
        phone: null,
        webhook_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(
        controller.supplierLogin({
          email: 'supplier@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // --- Supplier endpoints ---

  describe('getLinkedRestaurants', () => {
    it('should delegate to service with supplier ID from token', async () => {
      const mockRestaurants = [
        {
          linkId: 'link-1',
          locationId: 'loc-1',
          locationName: 'Kitchen A',
          address: '123 Main St',
          organizationId: 'org-1',
        },
      ];
      service.getLinkedRestaurants.mockResolvedValue(mockRestaurants);

      const result = await controller.getLinkedRestaurants(supplierId);

      expect(service.getLinkedRestaurants).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(mockRestaurants);
    });
  });

  describe('getDemandData', () => {
    it('should delegate to service with supplier ID', async () => {
      const demandData = {
        pendingReordersCount: 5,
        approachingThresholdItems: [
          {
            id: 'item-1',
            item_name: 'Salmon',
            current_quantity: 2,
            reorder_threshold: 5,
            tenant_id: 'loc-1',
          },
        ],
      };
      service.getDemandData.mockResolvedValue(demandData);

      const result = await controller.getDemandData(supplierId);

      expect(service.getDemandData).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(demandData);
    });
  });

  describe('getSupplierOrders', () => {
    it('should delegate to service with supplier ID', async () => {
      const mockOrders = [
        { id: 'order-1', supplier_id: supplierId, status: 'pending' },
      ];
      service.getSupplierOrders.mockResolvedValue(mockOrders as any);

      const result = await controller.getSupplierOrders(supplierId);

      expect(service.getSupplierOrders).toHaveBeenCalledWith(supplierId);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('batchConfirmOrders', () => {
    it('should delegate to service with supplier ID and order IDs', async () => {
      const dto = { orderIds: ['order-1', 'order-2'] };
      service.batchConfirmOrders.mockResolvedValue({
        confirmed: 2,
        failed: 0,
      });

      const result = await controller.batchConfirmOrders(supplierId, dto);

      expect(service.batchConfirmOrders).toHaveBeenCalledWith(supplierId, [
        'order-1',
        'order-2',
      ]);
      expect(result).toEqual({ confirmed: 2, failed: 0 });
    });
  });

  describe('batchRouteOrders', () => {
    it('should delegate to service with supplier ID and groups', async () => {
      const dto = {
        groups: [
          {
            orderIds: ['order-1'],
            deliveryTime: '2026-03-29T10:00:00Z',
          },
        ],
      };
      service.batchRouteOrders.mockResolvedValue({
        routed: 1,
        groups: [
          {
            orderId: 'order-1',
            deliveryTime: '2026-03-29T10:00:00Z',
            status: 'shipped',
          },
        ],
      });

      const result = await controller.batchRouteOrders(supplierId, dto);

      expect(service.batchRouteOrders).toHaveBeenCalledWith(
        supplierId,
        dto.groups,
      );
      expect(result.routed).toBe(1);
    });
  });

  describe('confirmOrder', () => {
    it('should delegate to service with supplier ID and order ID', async () => {
      service.confirmOrder.mockResolvedValue({ confirmed: true });

      const result = await controller.confirmOrder(supplierId, 'order-1');

      expect(service.confirmOrder).toHaveBeenCalledWith(supplierId, 'order-1');
      expect(result).toEqual({ confirmed: true });
    });
  });

  describe('getTrends', () => {
    it('should delegate to service with supplier ID and optional locationId', async () => {
      const trendData = {
        inventoryLevels: [],
        trendingUp: [],
        frequently86d: [],
      };
      service.getTrends.mockResolvedValue(trendData);

      const result = await controller.getTrends(supplierId, 'loc-1');

      expect(service.getTrends).toHaveBeenCalledWith(supplierId, 'loc-1');
      expect(result).toEqual(trendData);
    });

    it('should call service without locationId when not provided', async () => {
      service.getTrends.mockResolvedValue({
        inventoryLevels: [],
        trendingUp: [],
        frequently86d: [],
      });

      await controller.getTrends(supplierId, undefined);

      expect(service.getTrends).toHaveBeenCalledWith(supplierId, undefined);
    });
  });

  describe('getSupplierOrdersForKitchen', () => {
    it('should delegate to service with tenant ID', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          items: [],
          status: 'pending',
          supplier_name: 'Fresh Foods',
        },
      ];
      service.getActiveSupplierOrdersForLocation.mockResolvedValue(
        mockOrders as any,
      );

      const result = await controller.getSupplierOrdersForKitchen('loc-1');

      expect(service.getActiveSupplierOrdersForLocation).toHaveBeenCalledWith(
        'loc-1',
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('createSupplierLink', () => {
    it('should delegate to service with supplier and location IDs', async () => {
      const mockLink = {
        id: 'link-1',
        supplier_id: supplierId,
        location_id: 'loc-1',
        created_at: new Date(),
      };
      service.createLink.mockResolvedValue(mockLink);

      const result = await controller.createSupplierLink({
        supplierId,
        locationId: 'loc-1',
      });

      expect(service.createLink).toHaveBeenCalledWith(supplierId, 'loc-1');
      expect(result).toEqual(mockLink);
    });
  });

  describe('deleteSupplierLink', () => {
    it('should delegate to service with link ID', async () => {
      await controller.deleteSupplierLink('link-1');

      expect(service.deleteLink).toHaveBeenCalledWith('link-1');
    });
  });
});
