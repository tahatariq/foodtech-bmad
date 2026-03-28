import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplierOrderStatus } from './SupplierOrderStatus';
import type { SupplierOrder } from '../../../api/orders.api';

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

function makeOrder(overrides: Partial<SupplierOrder> = {}): SupplierOrder {
  return {
    id: 'order-1',
    supplierName: 'Fresh Farms',
    items: [{ itemName: 'Salmon', quantity: 10 }],
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('SupplierOrderStatus', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders supplier orders with correct status badges', () => {
    const orders: SupplierOrder[] = [
      makeOrder({ id: '1', status: 'pending' }),
      makeOrder({ id: '2', status: 'confirmed' }),
      makeOrder({ id: '3', status: 'shipped' }),
    ];

    render(<SupplierOrderStatus orders={orders} />);

    const badges = screen.getAllByTestId('status-badge');
    expect(badges).toHaveLength(3);
    expect(badges[0]).toHaveTextContent('pending');
    expect(badges[1]).toHaveTextContent('confirmed');
    expect(badges[2]).toHaveTextContent('shipped');
  });

  it('shows warning attention state for pending orders older than 4 hours', () => {
    const fiveHoursAgo = new Date(
      Date.now() - 5 * 60 * 60 * 1000,
    ).toISOString();

    const orders: SupplierOrder[] = [
      makeOrder({ id: '1', status: 'pending', createdAt: fiveHoursAgo }),
    ];

    render(<SupplierOrderStatus orders={orders} />);

    const wrapper = screen.getByTestId('attention-wrapper');
    expect(wrapper).toHaveAttribute('data-attention-level', 'warning');
    expect(screen.getByTestId('unconfirmed-label')).toHaveTextContent(
      'Unconfirmed',
    );
  });

  it('does not show warning for recent pending orders', () => {
    const orders: SupplierOrder[] = [
      makeOrder({
        id: '1',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }),
    ];

    render(<SupplierOrderStatus orders={orders} />);

    expect(screen.queryByTestId('attention-wrapper')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unconfirmed-label')).not.toBeInTheDocument();
  });

  it('shows expected delivery for confirmed orders', () => {
    const orders: SupplierOrder[] = [
      makeOrder({
        id: '1',
        status: 'confirmed',
        expectedDelivery: '2026-03-29T10:00:00Z',
      }),
    ];

    render(<SupplierOrderStatus orders={orders} />);

    expect(screen.getByTestId('expected-delivery')).toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    render(<SupplierOrderStatus orders={[]} />);

    expect(screen.getByText('No active supplier orders')).toBeInTheDocument();
  });

  it('displays item names and quantities', () => {
    const orders: SupplierOrder[] = [
      makeOrder({
        id: '1',
        items: [
          { itemName: 'Salmon', quantity: 10 },
          { itemName: 'Tuna', quantity: 5 },
        ],
      }),
    ];

    render(<SupplierOrderStatus orders={orders} />);

    expect(screen.getByText('Salmon x10')).toBeInTheDocument();
    expect(screen.getByText('Tuna x5')).toBeInTheDocument();
  });
});
