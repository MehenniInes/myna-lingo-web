import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getCallSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  const token = getToken() || '';
  socket = io(`${API_URL}/calls`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  // Expose for manual testing in dev
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    (window as any).__callSocket = socket;
  }
  return socket;
}

export function disconnectCallSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}