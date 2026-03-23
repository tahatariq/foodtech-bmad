import React, { createContext, useContext, useMemo } from 'react';
import { useSocket, ConnectionStatus } from '../hooks/useSocket';
import { Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  unsubscribe: (event: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  tenantId: string;
  token: string;
  children: React.ReactNode;
}

export function SocketProvider({
  tenantId,
  token,
  children,
}: SocketProviderProps) {
  const socketState = useSocket({ tenantId, token });

  const value = useMemo(
    () => socketState,
    [socketState],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
