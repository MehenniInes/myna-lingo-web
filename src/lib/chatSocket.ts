import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  const token = getToken() || '';
  socket = io(`${API_URL}/chat`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}