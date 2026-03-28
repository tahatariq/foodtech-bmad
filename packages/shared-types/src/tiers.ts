import type { SubscriptionTier, TierLimits, TierFeature } from './models';

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  indie: {
    maxLocations: 1,
    maxStaff: 5,
    supplierApi: false,
    supplierPortal: false,
    sso: false,
  },
  growth: {
    maxLocations: 10,
    maxStaff: 50,
    supplierApi: true,
    supplierPortal: true,
    sso: false,
  },
  enterprise: {
    maxLocations: Infinity,
    maxStaff: Infinity,
    supplierApi: true,
    supplierPortal: true,
    sso: true,
  },
};

export const TIER_FEATURES: Record<TierFeature, SubscriptionTier> = {
  SUPPLIER_API: 'growth',
  SUPPLIER_PORTAL: 'growth',
  SSO: 'enterprise',
  UNLIMITED_LOCATIONS: 'enterprise',
  UNLIMITED_STAFF: 'enterprise',
};
