import { renderHook, act } from '@testing-library/react';
import { useCustomerSocket } from './useCustomerSocket';

// Store event handlers so we can trigger them in tests
const mockHandlers: Record<string, (...args: unknown[]) => void> = {};
const mockIoHandlers: Record<string, (...args: unknown[]) => void> = {};

const mockSocket = {
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    mockHandlers[event] = handler;
  }),
  off: vi.fn(),
  disconnect: vi.fn(),
  io: {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      mockIoHandlers[event] = handler;
    }),
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../api/tracking.api', () => ({
  getOrderByToken: vi.fn(),
}));

describe('useCustomerSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockHandlers).forEach((k) => delete mockHandlers[k]);
    Object.keys(mockIoHandlers).forEach((k) => delete mockIoHandlers[k]);
  });

  it('returns initial disconnected state', () => {
    const { result } = renderHook(() => useCustomerSocket('test-token'));
    expect(result.current.currentStage).toBeNull();
    expect(result.current.etaMinutes).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('updates stage on order.stage.changed event', () => {
    const { result } = renderHook(() => useCustomerSocket('test-token'));

    // Simulate connect
    act(() => {
      mockHandlers['connect']?.();
    });
    expect(result.current.isConnected).toBe(true);

    // Simulate stage change
    act(() => {
      mockHandlers['order.stage.changed']?.({ stage: 'preparing' });
    });
    expect(result.current.currentStage).toBe('preparing');
  });

  it('updates eta on order.eta.updated event', () => {
    const { result } = renderHook(() => useCustomerSocket('test-token'));

    act(() => {
      mockHandlers['order.eta.updated']?.({ etaMinutes: 5 });
    });
    expect(result.current.etaMinutes).toBe(5);
  });

  it('does not connect when token is undefined', async () => {
    const socketModule = await import('socket.io-client');
    const ioMock = vi.mocked(socketModule.io);
    ioMock.mockClear();
    renderHook(() => useCustomerSocket(undefined));
    expect(ioMock).not.toHaveBeenCalled();
  });
});
