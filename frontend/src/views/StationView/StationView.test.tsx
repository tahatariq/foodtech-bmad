import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Mock the orders API to avoid actual fetches
vi.mock('../../api/orders.api', () => ({
  getOrdersByStation: vi.fn().mockResolvedValue([]),
  bumpOrder: vi.fn().mockResolvedValue({}),
  getStations: vi.fn().mockResolvedValue([]),
}));

import { StationView } from './StationView';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('StationView', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders empty state when no station selected', async () => {
    renderWithProviders(<StationView />);
    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState).toHaveTextContent(
      'No tickets right now. Orders will appear here automatically.',
    );
  });

  it('renders station selector dropdown', () => {
    renderWithProviders(<StationView />);
    expect(screen.getByTestId('station-selector')).toBeInTheDocument();
  });

  it('renders ConnectionIndicator with status role', () => {
    renderWithProviders(<StationView />);
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('connection-dot')).toBeInTheDocument();
  });

  it('uses KitchenTokenProvider (dark theme)', () => {
    renderWithProviders(<StationView />);
    expect(screen.getByTestId('kitchen-provider')).toBeInTheDocument();
  });

  it('station selector has aria-label for accessibility', () => {
    renderWithProviders(<StationView />);
    const selector = screen.getByTestId('station-selector');
    expect(selector).toHaveAttribute('aria-label', 'Select station');
  });

  it('does not have horizontal overflow', () => {
    renderWithProviders(<StationView />);
    const container = screen.getByTestId('kitchen-provider').firstElementChild;
    expect(container).toHaveStyle({ overflowX: 'hidden' });
  });

  it('empty state has role="status" for screen reader announcement', async () => {
    renderWithProviders(<StationView />);
    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState).toHaveAttribute('role', 'status');
  });
});
