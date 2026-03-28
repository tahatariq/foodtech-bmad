import { render, screen } from '@testing-library/react';
import { CustomerProgressSteps } from './CustomerProgressSteps';

describe('CustomerProgressSteps', () => {
  it('renders all 4 default stages', () => {
    render(<CustomerProgressSteps currentStep={1} />);
    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('Plating')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('marks previous steps as done with checkmark', () => {
    render(<CustomerProgressSteps currentStep={3} />);
    const progressbar = screen.getByRole('progressbar');
    // Steps 1 and 2 should show checkmarks
    const checks = progressbar.querySelectorAll('div');
    const checkmarks = Array.from(checks).filter(
      (el) => el.textContent === '✓',
    );
    expect(checkmarks).toHaveLength(2);
  });

  it('shows step number for active step', () => {
    render(<CustomerProgressSteps currentStep={2} />);
    // Step 2 is active, should show "2"
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.textContent).toContain('2');
  });

  it('shows step numbers for pending steps', () => {
    render(<CustomerProgressSteps currentStep={1} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.textContent).toContain('2');
    expect(progressbar.textContent).toContain('3');
    expect(progressbar.textContent).toContain('4');
  });

  it('sets correct ARIA attributes', () => {
    render(<CustomerProgressSteps currentStep={2} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
    expect(progressbar).toHaveAttribute(
      'aria-label',
      'Order progress: Preparing of 4 stages',
    );
  });

  it('shows all done at step 4', () => {
    render(<CustomerProgressSteps currentStep={4} />);
    const progressbar = screen.getByRole('progressbar');
    // Steps 1-3 show checkmarks, step 4 shows "4" (active)
    const checkmarks = Array.from(progressbar.querySelectorAll('div')).filter(
      (el) => el.textContent === '✓',
    );
    expect(checkmarks).toHaveLength(3);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('accepts custom stages', () => {
    render(
      <CustomerProgressSteps
        currentStep={1}
        stages={['One', 'Two', 'Three', 'Four']}
      />,
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Four')).toBeInTheDocument();
  });
});
