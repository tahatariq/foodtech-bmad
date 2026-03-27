import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

vi.mock('../../api/orders.api', () => ({
  getAllOrders: vi.fn().mockResolvedValue([]),
  getStationStatuses: vi.fn().mockResolvedValue([]),
  get86dItems: vi.fn().mockResolvedValue([]),
  getTempo: vi.fn().mockResolvedValue({
    tempoValue: 0,
    status: 'green',
    stationBreakdown: [],
    target: 5,
    calculatedAt: new Date().toISOString(),
  }),
}));

import { ExpeditorDashboard } from './ExpeditorDashboard';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ExpeditorDashboard', () => {
  it('renders the dashboard header', () => {
    renderWithQuery(<ExpeditorDashboard />);
    expect(screen.getByText('Expeditor Dashboard')).toBeInTheDocument();
  });

  it('shows connection indicator', () => {
    renderWithQuery(<ExpeditorDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    renderWithQuery(<ExpeditorDashboard />);
    expect(
      await screen.findByText('All clear. Kitchen is idle.'),
    ).toBeInTheDocument();
  });

  it('applies kitchen dark theme', () => {
    const { container } = renderWithQuery(<ExpeditorDashboard />);
    const themeDiv = container.querySelector('[data-theme="kitchen"]');
    expect(themeDiv).not.toBeNull();
  });
});
