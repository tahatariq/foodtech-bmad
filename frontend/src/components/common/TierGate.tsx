import type { ReactNode } from 'react';

type Tier = 'indie' | 'growth' | 'enterprise';

const TIER_ORDER: Record<Tier, number> = {
  indie: 0,
  growth: 1,
  enterprise: 2,
};

interface TierGateProps {
  requiredTier: Tier;
  currentTier: Tier;
  children: ReactNode;
}

export function TierGate({ requiredTier, currentTier, children }: TierGateProps) {
  if (TIER_ORDER[currentTier] >= TIER_ORDER[requiredTier]) {
    return <>{children}</>;
  }

  return (
    <div data-testid="tier-upgrade-prompt" style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, textAlign: 'center' }}>
      <p>
        This feature requires the <strong>{requiredTier}</strong> tier or above.
      </p>
      <p>
        You are currently on the <strong>{currentTier}</strong> tier.
      </p>
      <button data-testid="upgrade-button" type="button">
        Upgrade to {requiredTier}
      </button>
    </div>
  );
}
