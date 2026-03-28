import { render, screen } from '@testing-library/react';
import { TierGate } from './TierGate';

describe('TierGate', () => {
  it('renders children when current tier meets required tier', () => {
    render(
      <TierGate requiredTier="indie" currentTier="indie">
        <p>Feature content</p>
      </TierGate>,
    );
    expect(screen.getByText('Feature content')).toBeInTheDocument();
    expect(screen.queryByTestId('tier-upgrade-prompt')).not.toBeInTheDocument();
  });

  it('renders children when current tier exceeds required tier', () => {
    render(
      <TierGate requiredTier="indie" currentTier="enterprise">
        <p>Enterprise feature</p>
      </TierGate>,
    );
    expect(screen.getByText('Enterprise feature')).toBeInTheDocument();
    expect(screen.queryByTestId('tier-upgrade-prompt')).not.toBeInTheDocument();
  });

  it('renders children when growth meets growth requirement', () => {
    render(
      <TierGate requiredTier="growth" currentTier="growth">
        <p>Growth feature</p>
      </TierGate>,
    );
    expect(screen.getByText('Growth feature')).toBeInTheDocument();
  });

  it('shows upgrade prompt when tier is not met', () => {
    render(
      <TierGate requiredTier="enterprise" currentTier="indie">
        <p>Hidden feature</p>
      </TierGate>,
    );
    expect(screen.queryByText('Hidden feature')).not.toBeInTheDocument();
    expect(screen.getByTestId('tier-upgrade-prompt')).toBeInTheDocument();
    expect(screen.getAllByText(/enterprise/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
  });

  it('shows upgrade prompt when growth tries to access enterprise', () => {
    render(
      <TierGate requiredTier="enterprise" currentTier="growth">
        <p>Enterprise only</p>
      </TierGate>,
    );
    expect(screen.queryByText('Enterprise only')).not.toBeInTheDocument();
    expect(screen.getByTestId('tier-upgrade-prompt')).toBeInTheDocument();
  });
});
