import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceTempoGauge } from './ServiceTempoGauge';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('ServiceTempoGauge', () => {
  it('renders tempo value and label', () => {
    render(
      <ServiceTempoGauge value={3.5} target={5} status="green" />,
    );
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('avg minutes per ticket')).toBeInTheDocument();
    expect(screen.getByText('Flowing')).toBeInTheDocument();
  });

  it('shows correct label for amber status', () => {
    render(
      <ServiceTempoGauge value={7} target={5} status="amber" />,
    );
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('shows correct label for red status', () => {
    render(
      <ServiceTempoGauge value={12} target={5} status="red" />,
    );
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <ServiceTempoGauge value={4} target={5} status="green" />,
    );
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute(
      'aria-label',
      'Service Tempo: 4 minutes, status green',
    );
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '10');
    expect(meter).toHaveAttribute('aria-valuenow', '4');
  });

  it('renders large variant with 64px font', () => {
    render(
      <ServiceTempoGauge value={5} target={5} status="amber" variant="large" />,
    );
    const number = screen.getByText('5');
    expect(number.style.fontSize).toBe('64px');
  });

  it('renders compact variant with 32px font', () => {
    render(
      <ServiceTempoGauge
        value={5}
        target={5}
        status="amber"
        variant="compact"
      />,
    );
    const number = screen.getByText('5');
    expect(number.style.fontSize).toBe('32px');
  });

  it('shows target and critical labels', () => {
    render(
      <ServiceTempoGauge value={5} target={5} status="amber" />,
    );
    expect(screen.getByText('Target: 5m')).toBeInTheDocument();
    expect(screen.getByText('Critical: 10m')).toBeInTheDocument();
  });
});
