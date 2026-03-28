export const SubscriptionTier = {
  INDIE: 'indie',
  GROWTH: 'growth',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTierType =
  (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const TIER_HIERARCHY: SubscriptionTierType[] = [
  SubscriptionTier.INDIE,
  SubscriptionTier.GROWTH,
  SubscriptionTier.ENTERPRISE,
];

export function meetsMinimumTier(
  currentTier: SubscriptionTierType,
  requiredTier: SubscriptionTierType,
): boolean {
  return (
    TIER_HIERARCHY.indexOf(currentTier) >= TIER_HIERARCHY.indexOf(requiredTier)
  );
}

export const TierFeature = {
  SUPPLIER_API: 'SUPPLIER_API',
  SUPPLIER_PORTAL: 'SUPPLIER_PORTAL',
  SSO: 'SSO',
  UNLIMITED_LOCATIONS: 'UNLIMITED_LOCATIONS',
  UNLIMITED_STAFF: 'UNLIMITED_STAFF',
} as const;

export type TierFeatureType = (typeof TierFeature)[keyof typeof TierFeature];

export interface TierLimits {
  maxLocations: number;
  maxStaff: number;
  supplierApi: boolean;
  supplierPortal: boolean;
  sso: boolean;
}

export const DEFAULT_TIER_LIMITS: Record<SubscriptionTierType, TierLimits> = {
  indie: {
    maxLocations: 1,
    maxStaff: 10,
    supplierApi: false,
    supplierPortal: false,
    sso: false,
  },
  growth: {
    maxLocations: 10,
    maxStaff: -1,
    supplierApi: false,
    supplierPortal: true,
    sso: false,
  },
  enterprise: {
    maxLocations: -1,
    maxStaff: -1,
    supplierApi: true,
    supplierPortal: true,
    sso: true,
  },
};

export function getNextTier(
  tier: SubscriptionTierType,
): SubscriptionTierType | null {
  const idx = TIER_HIERARCHY.indexOf(tier);
  return idx < TIER_HIERARCHY.length - 1 ? TIER_HIERARCHY[idx + 1] : null;
}
