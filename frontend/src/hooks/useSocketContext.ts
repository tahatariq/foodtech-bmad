import { useContext } from 'react';
import { SocketContext } from '../providers/SocketProvider';

export function useSocketContext() {
  return useContext(SocketContext);
}