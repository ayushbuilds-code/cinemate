import { io, Socket } from 'socket.io-client';

// If VITE_SERVER_URL is provided, use it. Otherwise, default to current window origin (same-origin for Render)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

class SocketService {
  private socket: Socket | null = null;
  private participantId: string = '';

  public getOrCreateParticipantId(): string {
    if (this.participantId) return this.participantId;
    let stored = localStorage.getItem('cinemate_participant_id');
    if (!stored) {
      stored = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('cinemate_participant_id', stored);
    }
    this.participantId = stored;
    return this.participantId;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }
    return this.socket;
  }

  public connect(): Socket {
    const s = this.getSocket();
    if (!s.connected) {
      s.connect();
    }
    return s;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();

