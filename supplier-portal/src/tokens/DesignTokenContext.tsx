import { createContext, useContext } from 'react';

export interface DesignTokenContextValue {
  theme: 'kitchen' | 'office';
  targetSize: number;
  contrastMode: 'high' | 'normal';
  infoDensity: 'sparse' | 'dense';
}

export const DesignTokenContext = createContext<DesignTokenContextValue | null>(
  null,
);

export function useDesignTokens(): DesignTokenContextValue {
  const ctx = useContext(DesignTokenContext);
  if (!ctx) {
    throw new Error('useDesignTokens must be used within a TokenProvider');
  }
  return ctx;
}
