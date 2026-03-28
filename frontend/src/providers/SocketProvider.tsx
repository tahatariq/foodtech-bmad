import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import type { ConnectionState } from '../components/ConnectionIndicator';
import type { Order } from '../api/orders.api';

interface SocketContextValue {
  connectionState: ConnectionState;
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({
  connectionState: 'offline',
  socket: null,
});

export { SocketContext };

const processedEvents = new Set<string>();

function cleanupProcessedEvents() {
  processedEvents.clear();
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('offline');
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { accessToken, tenantId, stationId } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !tenantId) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const newSocket = io(`/tenant-${tenantId}`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const socket = socketRef.current;
    if (!socket) return;

    socket.on('connect', () => {
      setConnectionState('connected');
      if (stationId) {
        socket.emit('join:room', { room: `station:${stationId}` });
      }
    });

    socket.on('disconnect', () => setConnectionState('offline'));
    socket.on('reconnecting', () => setConnectionState('reconnecting'));
    socket.io.on('reconnect_attempt', () =>
      setConnectionState('reconnecting'),
    );

    socket.on('order.created', (event: { eventId: string; payload: Order }) => {
      if (processedEvents.has(event.eventId)) return;
      processedEvents.add(event.eventId);

      queryClient.setQueryData<Order[]>(
        ['station-orders', stationId],
        (old) => (old ? [...old, event.payload] : [event.payload]),
      );
    });

    socket.on(
      'order.stage.changed',
      (event: {
        eventId: string;
        payload: {
          orderId: string;
          items: { id: string; toStage: string }[];
        };
      }) => {
        if (processedEvents.has(event.eventId)) return;
        processedEvents.add(event.eventId);

        queryClient.setQueryData<Order[]>(
          ['station-orders', stationId],
          (old) =>
            old?.map((order) => {
              if (order.id !== event.payload.orderId) return order;
              return {
                ...order,
                items: order.items.map((item) => {
                  const update = event.payload.items.find(
                    (u) => u.id === item.id,
                  );
                  return update ? { ...item, stage: update.toStage } : item;
                }),
              };
            }) ?? [],
        );
      },
    );

    socket.on(
      'order.completed',
      (event: { eventId: string; payload: { orderId: string } }) => {
        if (processedEvents.has(event.eventId)) return;
        processedEvents.add(event.eventId);

        queryClient.setQueryData<Order[]>(
          ['station-orders', stationId],
          (old) =>
            old?.filter((o) => o.id !== event.payload.orderId) ?? [],
        );
      },
    );

    const cleanupInterval = setInterval(cleanupProcessedEvents, 60_000);

    return () => {
      clearInterval(cleanupInterval);
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, tenantId, stationId, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider
      value={{ connectionState, socket }}
    >
      {children}
    </SocketContext.Provider>
  );
}
