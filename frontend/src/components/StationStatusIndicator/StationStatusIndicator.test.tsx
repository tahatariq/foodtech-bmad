import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StationStatusIndicator } from './StationStatusIndicator';

describe('StationStatusIndicator', () => {
  it('renders station name and ticket count', () => {
    render(
      <StationStatusIndicator
        stationName="Grill"
        status="green"
        ticketCount={2}
      />,
    );
    expect(screen.getByText('Grill')).toBeInTheDocument();
    expect(screen.getByText('2 tickets')).toBeInTheDocument();
  });

  it('shows correct status text for each status', () => {
    const { rerender } = render(
      <StationStatusIndicator
        stationName="Grill"
        status="green"
        ticketCount={1}
      />,
    );
    expect(screen.getByText('Flowing')).toBeInTheDocument();

    rerender(
      <StationStatusIndicator
        stationName="Grill"
        status="yellow"
        ticketCount={5}
      />,
    );
    expect(screen.getByText('Watch')).toBeInTheDocument();

    rerender(
      <StationStatusIndicator
        stationName="Grill"
        status="red"
        ticketCount={8}
      />,
    );
    expect(screen.getByText('Backed up')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(
      <StationStatusIndicator
        stationName="Grill"
        status="yellow"
        ticketCount={5}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Grill: 5 tickets, status Watch',
    );
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <StationStatusIndicator
        stationName="Grill"
        status="green"
        ticketCount={2}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows emoji when provided', () => {
    render(
      <StationStatusIndicator
        stationName="Grill"
        stationEmoji="🔥"
        status="green"
        ticketCount={2}
      />,
    );
    expect(screen.getByText(/🔥/)).toBeInTheDocument();
  });
});
