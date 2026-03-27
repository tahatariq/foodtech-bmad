import { Injectable } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import type { SubscriptionTierType } from '../../common/constants/tiers';

@Injectable()
export class TenantsService {
  constructor(private readonly repository: TenantsRepository) {}

  async findOrganizationById(orgId: string) {
    return this.repository.findOrganizationById(orgId);
  }

  async findLocationById(locationId: string) {
    return this.repository.findLocationById(locationId);
  }

  async getOrganizationTier(
    tenantId: string,
  ): Promise<SubscriptionTierType | null> {
    const result =
      await this.repository.getOrganizationTierByLocationId(tenantId);
    return (result?.tier as SubscriptionTierType) ?? null;
  }

  async countLocationsByOrg(orgId: string): Promise<number> {
    return this.repository.countActiveLocationsByOrg(orgId);
  }

  async countStaffByLocation(tenantId: string): Promise<number> {
    return this.repository.countActiveStaffByLocation(tenantId);
  }
}
