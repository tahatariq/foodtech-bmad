import { useOfflineStore } from './offlineStore';

describe('offlineStore', () => {
  beforeEach(() => {
    const { clearQueue, setOffline, resetReconnectAttempts } =
      useOfflineStore.getState();
    clearQueue();
    setOffline(false);
    resetReconnectAttempts();
  });

  it('should queue a bump in FIFO order', () => {
    const { queueBump } = useOfflineStore.getState();
    queueBump('order-1', 'station-1');
    queueBump('order-2', 'station-1');

    const { queuedBumps } = useOfflineStore.getState();
    expect(queuedBumps).toHaveLength(2);
    expect(queuedBumps[0].orderId).toBe('order-1');
    expect(queuedBumps[1].orderId).toBe('order-2');
  });

  it('should dequeue a bump by orderId', () => {
    const { queueBump, dequeueBump } = useOfflineStore.getState();
    queueBump('order-1', 'station-1');
    queueBump('order-2', 'station-1');
    dequeueBump('order-1');

    const { queuedBumps } = useOfflineStore.getState();
    expect(queuedBumps).toHaveLength(1);
    expect(queuedBumps[0].orderId).toBe('order-2');
  });

  it('should clear all queued bumps', () => {
    const { queueBump, clearQueue } = useOfflineStore.getState();
    queueBump('order-1', 'station-1');
    queueBump('order-2', 'station-1');
    clearQueue();

    expect(useOfflineStore.getState().queuedBumps).toHaveLength(0);
  });

  it('should set offline state', () => {
    useOfflineStore.getState().setOffline(true);
    expect(useOfflineStore.getState().isOffline).toBe(true);

    useOfflineStore.getState().setOffline(false);
    expect(useOfflineStore.getState().isOffline).toBe(false);
  });

  it('should track last sync timestamp', () => {
    const ts = '2026-03-27T10:00:00.000Z';
    useOfflineStore.getState().setLastSyncTimestamp(ts);
    expect(useOfflineStore.getState().lastSyncTimestamp).toBe(ts);
  });

  it('should cache orders', () => {
    const orders = [
      {
        id: 'o1',
        orderNumber: 'ORD-001',
        status: 'received',
        items: [],
        createdAt: '2026-03-27T10:00:00Z',
      },
    ];
    useOfflineStore.getState().setCachedOrders(orders);
    expect(useOfflineStore.getState().cachedOrders).toEqual(orders);
  });

  it('should track reconnect attempts', () => {
    const { incrementReconnectAttempts, resetReconnectAttempts } =
      useOfflineStore.getState();
    incrementReconnectAttempts();
    incrementReconnectAttempts();
    expect(useOfflineStore.getState().reconnectAttempts).toBe(2);

    resetReconnectAttempts();
    expect(useOfflineStore.getState().reconnectAttempts).toBe(0);
  });

  it('should increment retry count for specific bump', () => {
    const { queueBump, incrementRetryCount } = useOfflineStore.getState();
    queueBump('order-1', 'station-1');
    queueBump('order-2', 'station-1');
    incrementRetryCount('order-1');

    const { queuedBumps } = useOfflineStore.getState();
    expect(queuedBumps[0].retryCount).toBe(1);
    expect(queuedBumps[1].retryCount).toBe(0);
  });

  it('should store bumps with timestamp', () => {
    const before = new Date().toISOString();
    useOfflineStore.getState().queueBump('order-1', 'station-1');
    const after = new Date().toISOString();

    const { queuedBumps } = useOfflineStore.getState();
    expect(queuedBumps[0].timestamp >= before).toBe(true);
    expect(queuedBumps[0].timestamp <= after).toBe(true);
  });
});
