import { io } from 'socket.io-client';

// The socket server usually runs on the same port as the backend API but without the /api prefix
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Singleton socket instance for the entire application.
 * autoConnect is false to allow manual connection after authentication.
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Helper to connect and join a clinic room
 */
export const connectSocket = (clinicId: string) => {
  if (!socket.connected) {
    socket.connect();
    
    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      if (clinicId) {
        socket.emit('join-clinic', clinicId);
        console.log(`[Socket] Joining clinic room: ${clinicId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  } else if (clinicId) {
    socket.emit('join-clinic', clinicId);
  }
};

/**
 * Helper to disconnect socket
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
