import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TierEnforcementService } from './tier-enforcement.service';

describe('TierEnforcementService', () => {
  let service: TierEnforcementService;
  let mockRepository: {
    findOrganizationById: jest.Mock;
    getOrganizationTierByLocationId: jest.Mock;
    countActiveLocationsByOrg: jest.Mock;
    countActiveStaffByLocation: jest.Mock;
  };
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockRepository = {
      findOrganizationById: jest.fn(),
      getOrganizationTierByLocationId: jest.fn(),
      countActiveLocationsByOrg: jest.fn(),
      countActiveStaffByLocation: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn().mockReturnValue(null),
    };
    service = new TierEnforcementService(
      mockRepository as unknown as import('./tenants.repository').TenantsRepository,
      mockConfigService as ConfigService,
    );
  });

  describe('checkLocationLimit', () => {
    it('should pass when under limit', async () => {
      mockRepository.findOrganizationById.mockResolvedValue({
        id: 'org-1',
        subscription_tier: 'indie',
      });
      mockRepository.countActiveLocationsByOrg.mockResolvedValue(0);

      await expect(
        service.checkLocationLimit('org-1'),
      ).resolves.toBeUndefined();
    });

    it('should throw 403 when at location limit', async () => {
      mockRepository.findOrganizationById.mockResolvedValue({
        id: 'org-1',
        subscription_tier: 'indie',
      });
      mockRepository.countActiveLocationsByOrg.mockResolvedValue(1);

      await expect(service.checkLocationLimit('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should pass with unlimited (-1) locations', async () => {
      mockRepository.findOrganizationById.mockResolvedValue({
        id: 'org-1',
        subscription_tier: 'enterprise',
      });

      await expect(
        service.checkLocationLimit('org-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('checkStaffLimit', () => {
    it('should throw when at staff limit', async () => {
      mockRepository.getOrganizationTierByLocationId.mockResolvedValue({
        tier: 'indie',
        organizationId: 'org-1',
      });
      mockRepository.countActiveStaffByLocation.mockResolvedValue(10);

      await expect(service.checkStaffLimit('loc-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should pass with unlimited staff', async () => {
      mockRepository.getOrganizationTierByLocationId.mockResolvedValue({
        tier: 'growth',
        organizationId: 'org-1',
      });
      mockRepository.countActiveStaffByLocation.mockResolvedValue(100);

      await expect(service.checkStaffLimit('loc-1')).resolves.toBeUndefined();
    });
  });

  describe('checkFeatureAccess', () => {
    it('should throw for disabled feature', async () => {
      mockRepository.findOrganizationById.mockResolvedValue({
        id: 'org-1',
        subscription_tier: 'indie',
      });

      await expect(
        service.checkFeatureAccess('org-1', 'SUPPLIER_API'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow enabled feature', async () => {
      mockRepository.findOrganizationById.mockResolvedValue({
        id: 'org-1',
        subscription_tier: 'enterprise',
      });

      const result = await service.checkFeatureAccess('org-1', 'SUPPLIER_API');
      expect(result).toBe(true);
    });
  });
});
