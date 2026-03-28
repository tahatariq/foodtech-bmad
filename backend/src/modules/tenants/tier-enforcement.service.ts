import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantsRepository } from './tenants.repository';
import {
  type SubscriptionTierType,
  type TierLimits,
  type TierFeatureType,
  DEFAULT_TIER_LIMITS,
  getNextTier,
} from '../../common/constants/tiers';

@Injectable()
export class TierEnforcementService {
  constructor(
    private readonly repository: TenantsRepository,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  getTierLimits(tier: SubscriptionTierType): TierLimits {
    const configLimits =
      this.configService.get<Record<string, TierLimits>>('tier');
    return configLimits?.[tier] ?? DEFAULT_TIER_LIMITS[tier];
  }

  async checkLocationLimit(organizationId: string): Promise<void> {
    const org = await this.repository.findOrganizationById(organizationId);
    if (!org) throw new ForbiddenException('Organization not found');

    const tier = org.subscription_tier as SubscriptionTierType;
    const limits = this.getTierLimits(tier);

    if (limits.maxLocations === -1) return;

    const currentCount =
      await this.repository.countActiveLocationsByOrg(organizationId);

    if (currentCount >= limits.maxLocations) {
      const nextTier = getNextTier(tier);
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: `Your ${tier} plan allows a maximum of ${limits.maxLocations} location(s). You currently have ${currentCount}.${nextTier ? ` Upgrade to ${nextTier} for more locations.` : ''}`,
      });
    }
  }

  async checkStaffLimit(tenantId: string): Promise<void> {
    const orgData =
      await this.repository.getOrganizationTierByLocationId(tenantId);
    if (!orgData) throw new ForbiddenException('Location not found');

    const tier = orgData.tier as SubscriptionTierType;
    const limits = this.getTierLimits(tier);

    if (limits.maxStaff === -1) return;

    const currentCount =
      await this.repository.countActiveStaffByLocation(tenantId);

    if (currentCount >= limits.maxStaff) {
      const nextTier = getNextTier(tier);
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: `Your ${tier} plan allows a maximum of ${limits.maxStaff} staff members. You currently have ${currentCount}.${nextTier ? ` Upgrade to ${nextTier} for more staff.` : ''}`,
      });
    }
  }

  async checkFeatureAccess(
    organizationId: string,
    feature: TierFeatureType,
  ): Promise<boolean> {
    const org = await this.repository.findOrganizationById(organizationId);
    if (!org) throw new ForbiddenException('Organization not found');

    const tier = org.subscription_tier as SubscriptionTierType;
    const limits = this.getTierLimits(tier);

    const featureMap: Record<TierFeatureType, boolean> = {
      SUPPLIER_API: limits.supplierApi,
      SUPPLIER_PORTAL: limits.supplierPortal,
      SSO: limits.sso,
      UNLIMITED_LOCATIONS: limits.maxLocations === -1,
      UNLIMITED_STAFF: limits.maxStaff === -1,
    };

    const hasAccess = featureMap[feature] ?? false;

    if (!hasAccess) {
      const nextTier = getNextTier(tier);
      throw new ForbiddenException({
        type: 'https://foodtech.app/errors/tier-restricted',
        title: 'Tier Restricted',
        status: 403,
        detail: `The ${feature} feature is not available on the ${tier} plan.${nextTier ? ` Upgrade to ${nextTier} to access this feature.` : ''}`,
      });
    }

    return true;
  }
}
