import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from './env.js';
import { setupRoomEvents } from '../rooms/roomEvents.js';
import { setupPlaybackEvents } from '../playback/playbackEvents.js';
import { setupChatEvents } from '../chat/chatEvents.js';
import { setupWebRTCEvents } from '../webrtc/signalingEvents.js';
import { roomManager } from '../rooms/roomManager.js';
import { logger } from '../utils/logger.js';

export function initializeSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: true, // Allow any valid origin or Render domain
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Register all event listeners
    setupRoomEvents(io, socket);
    setupPlaybackEvents(io, socket);
    setupChatEvents(io, socket);
    setupWebRTCEvents(io, socket);

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
      const { roomId, participant, roomEmpty } = roomManager.handleDisconnect(socket.id);

      if (roomId && !roomEmpty && participant) {
        const sysMsg = roomManager.addChatMessage(
          roomId,
          'system',
          'CineMate Bot',
          `${participant.displayName} disconnected`,
          true
        );

        io.in(roomId).emit('room:participant-left', {
          participantId: participant.participantId,
          systemMessage: sysMsg,
          room: roomManager.getRoom(roomId),
        });

        // Also signal peer WebRTC hangup if applicable
        socket.to(roomId).emit('webrtc:peer-hangup', {
          senderSocketId: socket.id,
        });
      }
    });
  });

  return io;
}
