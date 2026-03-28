import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './SocketProvider';
import { useSocketContext } from '../hooks/useSocketContext';

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    io: { on: vi.fn() },
  }),
}));

function TestConsumer() {
  const { connectionState } = useSocketContext();
  return <span data-testid="connection-state">{connectionState}</span>;
}

describe('SocketProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('provides offline connection state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('connection-state')).toHaveTextContent(
      'offline',
    );
  });

  it('renders children', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <span data-testid="child">hello</span>
        </SocketProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });
});
