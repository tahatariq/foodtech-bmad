import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CustomerTracker } from './CustomerTracker';
import * as trackingApi from '../../api/tracking.api';

// Mock the tracking API
vi.mock('../../api/tracking.api', () => ({
  getOrderByToken: vi.fn(),
}));

// Mock the customer socket hook
vi.mock('../../hooks/useCustomerSocket', () => ({
  useCustomerSocket: () => ({
    currentStage: null,
    etaMinutes: null,
    isConnected: false,
  }),
}));

function renderWithRouter(token = 'test-token-123') {
  return render(
    <MemoryRouter initialEntries={[`/track/${token}`]}>
      <Routes>
        <Route path="/track/:token" element={<CustomerTracker />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CustomerTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(trackingApi.getOrderByToken).mockReturnValue(
      new Promise(() => {}), // Never resolves
    );
    renderWithRouter();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error for expired token', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      error: 'expired',
      message: 'This link has expired',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    expect(screen.getByText('This link has expired')).toBeInTheDocument();
  });

  it('renders error on fetch failure', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockRejectedValue(
      new Error('Network error'),
    );
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  it('renders progress steps for valid order', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      expired: false,
      orderId: 'order-1',
      orderNumber: 'ORD-042',
      status: 'preparing',
      items: [{ itemName: 'Burger', stage: 'preparing', quantity: 1 }],
      createdAt: '2026-03-27T12:00:00Z',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('ORD-042')).toBeInTheDocument();
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getAllByText('Preparing').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "NOW" for ready state', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      expired: false,
      orderId: 'order-1',
      orderNumber: 'ORD-099',
      status: 'served',
      items: [{ itemName: 'Salad', stage: 'served', quantity: 1 }],
      createdAt: '2026-03-27T12:00:00Z',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('ORD-099')).toBeInTheDocument();
    });
    expect(screen.getByTestId('eta-display')).toHaveTextContent('NOW');
    expect(screen.getByTestId('ready-celebration')).toBeInTheDocument();
    expect(
      screen.getByText('Ready! Pick up at counter'),
    ).toBeInTheDocument();
  });

  it('shows correct ETA confidence level for received stage', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      expired: false,
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'received',
      items: [],
      createdAt: '2026-03-27T12:00:00Z',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('eta-display')).toHaveTextContent('~15 min');
    });
  });

  it('shows correct ETA confidence level for preparing stage', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      expired: false,
      orderId: 'order-1',
      orderNumber: 'ORD-002',
      status: 'preparing',
      items: [],
      createdAt: '2026-03-27T12:00:00Z',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('eta-display')).toHaveTextContent('~8 min');
    });
  });

  it('shows correct ETA confidence level for plating stage', async () => {
    vi.mocked(trackingApi.getOrderByToken).mockResolvedValue({
      expired: false,
      orderId: 'order-1',
      orderNumber: 'ORD-003',
      status: 'plating',
      items: [],
      createdAt: '2026-03-27T12:00:00Z',
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('eta-display')).toHaveTextContent('~2 min');
    });
  });
});
