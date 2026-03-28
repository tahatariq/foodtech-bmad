import { render, screen, fireEvent } from '@testing-library/react';
import { LocationCard } from './LocationCard';

describe('LocationCard', () => {
  it('renders name, order count, and staff count', () => {
    render(
      <LocationCard
        name="Downtown Kitchen"
        tempoStatus="green"
        orderCount={12}
        staffCount={5}
      />,
    );

    expect(screen.getByTestId('location-name')).toHaveTextContent('Downtown Kitchen');
    expect(screen.getByTestId('order-count')).toHaveTextContent('Orders: 12');
    expect(screen.getByTestId('staff-count')).toHaveTextContent('Staff: 5');
  });

  it('renders green tempo indicator', () => {
    render(
      <LocationCard
        name="Test"
        tempoStatus="green"
        orderCount={0}
        staffCount={0}
      />,
    );

    const indicator = screen.getByTestId('tempo-indicator');
    expect(indicator).toHaveAttribute('data-tempo', 'green');
    expect(indicator).toHaveStyle({ backgroundColor: '#22c55e' });
  });

  it('renders amber tempo indicator', () => {
    render(
      <LocationCard
        name="Test"
        tempoStatus="amber"
        orderCount={0}
        staffCount={0}
      />,
    );

    const indicator = screen.getByTestId('tempo-indicator');
    expect(indicator).toHaveAttribute('data-tempo', 'amber');
    expect(indicator).toHaveStyle({ backgroundColor: '#f59e0b' });
  });

  it('renders red tempo indicator', () => {
    render(
      <LocationCard
        name="Test"
        tempoStatus="red"
        orderCount={0}
        staffCount={0}
      />,
    );

    const indicator = screen.getByTestId('tempo-indicator');
    expect(indicator).toHaveAttribute('data-tempo', 'red');
    expect(indicator).toHaveStyle({ backgroundColor: '#ef4444' });
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(
      <LocationCard
        name="Test"
        tempoStatus="green"
        orderCount={0}
        staffCount={0}
        onClick={handleClick}
      />,
    );

    fireEvent.click(screen.getByTestId('location-card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key press', () => {
    const handleClick = vi.fn();
    render(
      <LocationCard
        name="Test"
        tempoStatus="green"
        orderCount={0}
        staffCount={0}
        onClick={handleClick}
      />,
    );

    fireEvent.keyDown(screen.getByTestId('location-card'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
