import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWizard } from './OnboardingWizard';

function renderWizard() {
  return render(
    <MemoryRouter>
      <OnboardingWizard />
    </MemoryRouter>,
  );
}

describe('OnboardingWizard', () => {
  it('renders first step (Basic Info)', () => {
    renderWizard();
    expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument();
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    expect(screen.getByTestId('tenant-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('tier-select')).toBeInTheDocument();
  });

  it('shows step indicator with step 1', () => {
    renderWizard();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent(
      'Step 1 of 8',
    );
  });

  it('navigates between steps after tenant creation', async () => {
    // Mock the fetch call for tenant creation
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tenantId: 'test-tenant-id' }),
    });

    renderWizard();

    // Fill in the form
    fireEvent.change(screen.getByTestId('tenant-name-input'), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByTestId('tier-select'), {
      target: { value: 'growth' },
    });

    // Submit to go to step 2
    fireEvent.submit(screen.getByTestId('basic-info-step'));

    // Wait for step 2
    await screen.findByTestId('station-layout-step');
    expect(screen.getByTestId('step-indicator')).toHaveTextContent(
      'Step 2 of 8',
    );

    // Navigate forward
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('order-stages-step')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent(
      'Step 3 of 8',
    );

    // Navigate backward
    fireEvent.click(screen.getByTestId('prev-button'));
    expect(screen.getByTestId('station-layout-step')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator')).toHaveTextContent(
      'Step 2 of 8',
    );
  });

  it('shows activate button on last step', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tenantId: 'test-tenant-id' }),
    });

    renderWizard();

    // Create tenant first
    fireEvent.change(screen.getByTestId('tenant-name-input'), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.submit(screen.getByTestId('basic-info-step'));

    await screen.findByTestId('station-layout-step');

    // Navigate through all steps to the last one
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByTestId('next-button'));
    }

    expect(screen.getByTestId('review-activate-step')).toBeInTheDocument();
    expect(screen.getByTestId('activate-button')).toBeInTheDocument();
  });
});
