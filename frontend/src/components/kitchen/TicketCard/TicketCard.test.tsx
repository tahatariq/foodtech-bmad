import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketCard } from './TicketCard';
import type { Order } from '../../../api/orders.api';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

const mockOrder: Order = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  status: 'received',
  createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  items: [
    { id: 'item-1', itemName: 'Ribeye Steak', stationId: 'station-1', stage: 'received', quantity: 2 },
    { id: 'item-2', itemName: 'Fries', stationId: 'station-1', stage: 'received', quantity: 1 },
  ],
};

describe('TicketCard', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('displays order number', () => {
    render(<TicketCard order={mockOrder} />);
    expect(screen.getByTestId('order-number')).toHaveTextContent('#ORD-001');
  });

  it('displays items with quantities', () => {
    render(<TicketCard order={mockOrder} />);
    const items = screen.getAllByTestId('order-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('2x Ribeye Steak');
    expect(items[1]).toHaveTextContent('1x Fries');
  });

  it('displays progress timeline with elapsed time', () => {
    render(<TicketCard order={mockOrder} />);
    expect(screen.getByTestId('progress-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('progress-elapsed')).toBeInTheDocument();
  });

  it('has role="article" with accessible label', () => {
    render(<TicketCard order={mockOrder} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Order ORD-001'));
  });

  it('shows Badge86 for 86d items', () => {
    const eightySixed = new Set(['Fries']);
    render(<TicketCard order={mockOrder} eightySixedItems={eightySixed} />);
    const badges = screen.getAllByTestId('badge-86');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveAttribute('aria-label', expect.stringContaining('Fries'));
  });

  it('does not show Badge86 when no items are 86d', () => {
    render(<TicketCard order={mockOrder} />);
    expect(screen.queryByTestId('badge-86')).not.toBeInTheDocument();
  });

  it('shows offline indicator when offlineQueued is true', () => {
    render(<TicketCard order={mockOrder} offlineQueued />);
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
  });

  it('does not show offline indicator by default', () => {
    render(<TicketCard order={mockOrder} />);
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('uses stageEnteredAt for timing when available', () => {
    const orderWithStageTime = {
      ...mockOrder,
      stageEnteredAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 min ago
    };
    render(<TicketCard order={orderWithStageTime} />);
    const card = screen.getByRole('article');
    // Should reflect 6m elapsed, which is in warning zone
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('elapsed'));
  });

  it('renders progress bar with progressbar role', () => {
    render(<TicketCard order={mockOrder} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});
