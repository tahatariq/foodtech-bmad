import { registerAs } from '@nestjs/config';
import type { TierLimits } from '../constants/tiers';

export const tierConfig = registerAs('tier', () => {
  const config: Record<string, TierLimits> = {
    indie: {
      maxLocations: parseInt(process.env.TIER_INDIE_MAX_LOCATIONS ?? '1', 10),
      maxStaff: parseInt(process.env.TIER_INDIE_MAX_STAFF ?? '10', 10),
      supplierApi: false,
      supplierPortal: false,
      sso: false,
    },
    growth: {
      maxLocations: parseInt(process.env.TIER_GROWTH_MAX_LOCATIONS ?? '10', 10),
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

  return config;
});
