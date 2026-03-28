import { render, screen } from '@testing-library/react';
import { TierUpgradePrompt } from './TierUpgradePrompt';

describe('TierUpgradePrompt', () => {
  it('renders current tier', () => {
    render(<TierUpgradePrompt currentTier="indie" />);

    expect(screen.getByTestId('current-tier')).toHaveTextContent('indie');
  });

  it('shows comparison table', () => {
    render(<TierUpgradePrompt currentTier="growth" />);

    expect(screen.getByTestId('tier-comparison-table')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('SSO')).toBeInTheDocument();
  });

  it('shows upgrade CTA for non-enterprise tiers', () => {
    render(<TierUpgradePrompt currentTier="indie" />);

    expect(screen.getByTestId('upgrade-cta')).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-cta')).toHaveTextContent('Contact Sales to Upgrade');
  });

  it('hides upgrade CTA for enterprise tier', () => {
    render(<TierUpgradePrompt currentTier="enterprise" />);

    expect(screen.queryByTestId('upgrade-cta')).not.toBeInTheDocument();
  });

  it('renders current tier as growth', () => {
    render(<TierUpgradePrompt currentTier="growth" />);

    expect(screen.getByTestId('current-tier')).toHaveTextContent('growth');
    expect(screen.getByTestId('upgrade-cta')).toBeInTheDocument();
  });
});
