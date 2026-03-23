import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KitchenTokenProvider } from './KitchenTokenProvider';
import { OfficeTokenProvider } from './OfficeTokenProvider';
import { useDesignTokens } from './DesignTokenContext';

function TokenConsumer() {
  const tokens = useDesignTokens();
  return (
    <div>
      <span data-testid="theme">{tokens.theme}</span>
      <span data-testid="target-size">{tokens.targetSize}</span>
      <span data-testid="contrast-mode">{tokens.contrastMode}</span>
      <span data-testid="info-density">{tokens.infoDensity}</span>
    </div>
  );
}

describe('KitchenTokenProvider', () => {
  it('provides kitchen token values', () => {
    render(
      <KitchenTokenProvider>
        <TokenConsumer />
      </KitchenTokenProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('kitchen');
    expect(screen.getByTestId('target-size')).toHaveTextContent('48');
    expect(screen.getByTestId('contrast-mode')).toHaveTextContent('high');
    expect(screen.getByTestId('info-density')).toHaveTextContent('sparse');
  });

  it('applies data-theme="kitchen" attribute', () => {
    render(
      <KitchenTokenProvider>
        <span>child</span>
      </KitchenTokenProvider>,
    );

    expect(screen.getByTestId('kitchen-provider')).toHaveAttribute(
      'data-theme',
      'kitchen',
    );
  });
});

describe('OfficeTokenProvider', () => {
  it('provides office token values', () => {
    render(
      <OfficeTokenProvider>
        <TokenConsumer />
      </OfficeTokenProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('office');
    expect(screen.getByTestId('target-size')).toHaveTextContent('36');
    expect(screen.getByTestId('contrast-mode')).toHaveTextContent('normal');
    expect(screen.getByTestId('info-density')).toHaveTextContent('dense');
  });

  it('applies data-theme="office" attribute', () => {
    render(
      <OfficeTokenProvider>
        <span>child</span>
      </OfficeTokenProvider>,
    );

    expect(screen.getByTestId('office-provider')).toHaveAttribute(
      'data-theme',
      'office',
    );
  });
});

describe('useDesignTokens', () => {
  it('throws when used outside a provider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TokenConsumer />)).toThrow(
      'useDesignTokens must be used within a TokenProvider',
    );
    spy.mockRestore();
  });
});
