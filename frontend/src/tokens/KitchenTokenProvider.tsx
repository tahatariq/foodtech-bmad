import type { ReactNode } from 'react';
import { DesignTokenContext, type DesignTokenContextValue } from './DesignTokenContext';

const kitchenTokens: DesignTokenContextValue = {
  theme: 'kitchen',
  targetSize: 48,
  contrastMode: 'high',
  infoDensity: 'sparse',
};

export function KitchenTokenProvider({ children }: { children: ReactNode }) {
  return (
    <DesignTokenContext.Provider value={kitchenTokens}>
      <div data-theme="kitchen" data-testid="kitchen-provider">
        {children}
      </div>
    </DesignTokenContext.Provider>
  );
}
