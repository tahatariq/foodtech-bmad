import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getOrderByToken } from '../api/tracking.api';

interface CustomerSocketState {
  currentStage: string | null;
  etaMinutes: number | null;
  isConnected: boolean;
}

export function useCustomerSocket(token: string | undefined): CustomerSocketState {
  const socketRef = useRef<Socket | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchFallback = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getOrderByToken(token);
      if (!('error' in result)) {
        setCurrentStage(result.status);
      }
    } catch {
      // Silently fail on fallback fetch
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const socket = io('/', {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('order.stage.changed', (data: { stage: string }) => {
      setCurrentStage(data.stage);
    });

    socket.on('order.eta.updated', (data: { etaMinutes: number }) => {
      setEtaMinutes(data.etaMinutes);
    });

    socket.io.on('reconnect', () => {
      setIsConnected(true);
      void fetchFallback();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchFallback]);

  return { currentStage, etaMinutes, isConnected };
}
