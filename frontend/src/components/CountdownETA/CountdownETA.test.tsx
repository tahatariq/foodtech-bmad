import { render, screen } from '@testing-library/react';
import { CountdownETA } from './CountdownETA';

describe('CountdownETA', () => {
  it('shows "NOW" when isReady is true', () => {
    render(<CountdownETA minutes={0} isReady />);
    const el = screen.getByTestId('countdown-eta');
    expect(el).toHaveTextContent('NOW');
    expect(el).toHaveClass('text-green-600');
  });

  it('shows amber styling when minutes < 3', () => {
    render(<CountdownETA minutes={2} />);
    const el = screen.getByTestId('countdown-eta');
    expect(el).toHaveTextContent('~2 min');
    expect(el).toHaveClass('text-amber-500');
  });

  it('shows gray styling when minutes >= 3', () => {
    render(<CountdownETA minutes={8} />);
    const el = screen.getByTestId('countdown-eta');
    expect(el).toHaveTextContent('~8 min');
    expect(el).toHaveClass('text-gray-600');
  });

  it('has correct ARIA attributes for ready state', () => {
    render(<CountdownETA minutes={0} isReady />);
    const el = screen.getByRole('timer');
    expect(el).toHaveAttribute('aria-label', 'Ready now');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('has correct ARIA attributes for non-ready state', () => {
    render(<CountdownETA minutes={5} />);
    const el = screen.getByRole('timer');
    expect(el).toHaveAttribute('aria-label', 'Estimated 5 minutes');
  });

  it('renders large variant with text-3xl', () => {
    render(<CountdownETA minutes={5} variant="large" />);
    const el = screen.getByTestId('countdown-eta');
    expect(el).toHaveClass('text-3xl');
  });

  it('renders compact variant with text-lg', () => {
    render(<CountdownETA minutes={5} variant="compact" />);
    const el = screen.getByTestId('countdown-eta');
    expect(el).toHaveClass('text-lg');
  });
});
