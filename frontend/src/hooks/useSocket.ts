import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getTenantNamespace } from '@foodtech/shared-types';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseSocketOptions {
  tenantId: string;
  token: string;
  serverUrl?: string;
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
      newSocket.emit('request:state-sync');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
      newSocket.emit('request:state-sync');
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
