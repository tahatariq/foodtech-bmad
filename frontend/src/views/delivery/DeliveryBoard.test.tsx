import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeliveryBoard } from './DeliveryBoard';
import * as deliveryApi from '../../api/delivery.api';

vi.mock('../../api/delivery.api', () => ({
  getDeliveryOrders: vi.fn(),
  pickupDeliveryOrder: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

function renderBoard(search = '?key=test-key') {
  return render(
    <MemoryRouter initialEntries={[`/delivery${search}`]}>
      <DeliveryBoard />
    </MemoryRouter>,
  );
}

const mockOrders: deliveryApi.DeliveryOrder[] = [
  {
    id: 'o1',
    orderNumber: 'ORD-001',
    status: 'served',
    items: [{ itemName: 'Burger', quantity: 2 }],
    createdAt: new Date().toISOString(),
    etaMinutes: 0,
  },
  {
    id: 'o2',
    orderNumber: 'ORD-002',
    status: 'preparing',
    items: [{ itemName: 'Fries', quantity: 1 }],
    createdAt: new Date().toISOString(),
    etaMinutes: 8,
  },
];

describe('DeliveryBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows key input form when no key is provided', () => {
    renderBoard('');
    expect(screen.getByTestId('key-form')).toBeInTheDocument();
  });

  it('renders ready orders section', async () => {
    vi.mocked(deliveryApi.getDeliveryOrders).mockResolvedValue(mockOrders);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByTestId('ready-section')).toBeInTheDocument();
    });
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getAllByTestId('ready-order')).toHaveLength(1);
  });

  it('renders upcoming orders section', async () => {
    vi.mocked(deliveryApi.getDeliveryOrders).mockResolvedValue(mockOrders);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByTestId('upcoming-section')).toBeInTheDocument();
    });
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getAllByTestId('upcoming-order')).toHaveLength(1);
  });

  it('pickup button calls API and removes order', async () => {
    vi.mocked(deliveryApi.getDeliveryOrders).mockResolvedValue(mockOrders);
    vi.mocked(deliveryApi.pickupDeliveryOrder).mockResolvedValue(undefined);

    renderBoard();
    await waitFor(() => {
      expect(screen.getByTestId('pickup-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('pickup-button'));

    expect(deliveryApi.pickupDeliveryOrder).toHaveBeenCalledWith('test-key', 'o1');
  });

  it('shows board title when key is present', async () => {
    vi.mocked(deliveryApi.getDeliveryOrders).mockResolvedValue([]);
    renderBoard();
    await waitFor(() => {
      expect(screen.getByTestId('board-title')).toHaveTextContent('Delivery Board');
    });
  });
});
