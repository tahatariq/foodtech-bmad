import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getTenantNamespace } from '@foodtech/shared-types';
import { useOfflineStore } from '../stores/offlineStore';
import { bumpOrder } from '../api/orders.api';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseSocketOptions {
  tenantId: string;
  token: string;
  serverUrl?: string;
}

async function replayQueuedBumps() {
  const store = useOfflineStore.getState();
  const bumps = [...store.queuedBumps];

  for (const bump of bumps) {
    try {
      await bumpOrder(bump.orderId);
      store.dequeueBump(bump.orderId);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      if (status === 409) {
        // Conflict: server state wins, remove from queue
        store.dequeueBump(bump.orderId);
      } else {
        // Keep in queue for next reconnect attempt
        store.incrementRetryCount(bump.orderId);
      }
    }
  }
}

export function useSocket({ tenantId, token, serverUrl = '' }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (!tenantId || !token) return;

    const namespace = getTenantNamespace(tenantId);
    const newSocket = io(`${serverUrl}${namespace}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
      const store = useOfflineStore.getState();
      store.setOffline(false);
      store.resetReconnectAttempts();
      store.setLastSyncTimestamp(new Date().toISOString());
      newSocket.emit('request:state-sync');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      useOfflineStore.getState().setOffline(true);
    });

    newSocket.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
      useOfflineStore.getState().incrementReconnectAttempts();
    });

    newSocket.on('reconnect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
      const store = useOfflineStore.getState();
      store.setOffline(false);
      store.resetReconnectAttempts();
      store.setLastSyncTimestamp(new Date().toISOString());
      newSocket.emit('request:state-sync');

      // Replay queued bumps sequentially
      replayQueuedBumps();
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [tenantId, token, serverUrl]);

  const subscribe = useCallback(
    (event: string, callback: (data: unknown) => void) => {
      socketRef.current?.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    [],
  );

  const unsubscribe = useCallback((event: string) => {
    socketRef.current?.off(event);
  }, []);

  return {
    socket,
    connectionStatus,
    subscribe,
    unsubscribe,
  };
}
