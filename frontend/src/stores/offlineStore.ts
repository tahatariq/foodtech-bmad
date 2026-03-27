import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '../api/orders.api';

export interface QueuedBump {
  orderId: string;
  stationId: string;
  timestamp: string;
  retryCount: number;
}

interface OfflineState {
  queuedBumps: QueuedBump[];
  isOffline: boolean;
  lastSyncTimestamp: string | null;
  cachedOrders: Order[];
  reconnectAttempts: number;

  // Actions
  queueBump: (orderId: string, stationId: string) => void;
  dequeueBump: (orderId: string) => void;
  clearQueue: () => void;
  setOffline: (isOffline: boolean) => void;
  setLastSyncTimestamp: (timestamp: string) => void;
  setCachedOrders: (orders: Order[]) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  incrementRetryCount: (orderId: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queuedBumps: [],
      isOffline: false,
      lastSyncTimestamp: null,
      cachedOrders: [],
      reconnectAttempts: 0,

      queueBump: (orderId: string, stationId: string) =>
        set((state) => ({
          queuedBumps: [
            ...state.queuedBumps,
            {
              orderId,
              stationId,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        })),

      dequeueBump: (orderId: string) =>
        set((state) => ({
          queuedBumps: state.queuedBumps.filter((b) => b.orderId !== orderId),
        })),

      clearQueue: () => set({ queuedBumps: [] }),

      setOffline: (isOffline: boolean) => set({ isOffline }),

      setLastSyncTimestamp: (timestamp: string) =>
        set({ lastSyncTimestamp: timestamp }),

      setCachedOrders: (orders: Order[]) => set({ cachedOrders: orders }),

      incrementReconnectAttempts: () =>
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        })),

      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

      incrementRetryCount: (orderId: string) =>
        set((state) => ({
          queuedBumps: state.queuedBumps.map((b) =>
            b.orderId === orderId ? { ...b, retryCount: b.retryCount + 1 } : b,
          ),
        })),
    }),
    {
      name: 'foodtech-offline-store',
      partialize: (state) => ({
        queuedBumps: state.queuedBumps,
        cachedOrders: state.cachedOrders,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
    },
  ),
);
