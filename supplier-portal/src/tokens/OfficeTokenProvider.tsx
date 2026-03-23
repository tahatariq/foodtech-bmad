import type { ReactNode } from 'react';
import { DesignTokenContext, type DesignTokenContextValue } from './DesignTokenContext';

const officeTokens: DesignTokenContextValue = {
  theme: 'office',
  targetSize: 36,
  contrastMode: 'normal',
  infoDensity: 'dense',
};

export function OfficeTokenProvider({ children }: { children: ReactNode }) {
  return (
    <DesignTokenContext.Provider value={officeTokens}>
      <div data-theme="office" data-testid="office-provider">
        {children}
      </div>
    </DesignTokenContext.Provider>
  );
}
