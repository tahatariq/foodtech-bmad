import { SetMetadata } from '@nestjs/common';
import type { SubscriptionTierType, TierFeatureType } from '../constants/tiers';

export const TIER_KEY = 'tier';
export const TIER_FEATURE_KEY = 'tier_feature';

export interface TierGatedOptions {
  feature?: TierFeatureType;
}

/**
 * Restricts endpoint access to organizations on the specified tier or above.
 *
 * @example
 * @TierGated('growth')           // growth and enterprise only
 * @TierGated('enterprise', { feature: 'SUPPLIER_API' })  // enterprise with feature check
 */
export function TierGated(
  minimumTier: SubscriptionTierType,
  options?: TierGatedOptions,
): MethodDecorator & ClassDecorator {
  return (
    target: object,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    SetMetadata(TIER_KEY, minimumTier)(target, key!, descriptor!);
    if (options?.feature) {
      SetMetadata(TIER_FEATURE_KEY, options.feature)(
        target,
        key!,
        descriptor!,
      );
    }
    return descriptor ?? target;
  };
}
