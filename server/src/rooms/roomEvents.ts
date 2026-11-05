import { Server, Socket } from 'socket.io';
import { roomManager } from './roomManager.js';
import { createRoomSchema, joinRoomSchema, mediaLoadSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

export function setupRoomEvents(io: Server, socket: Socket) {
  // Create Room
  socket.on('room:create', (data, callback) => {
    try {
      const parsed = createRoomSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid input' });
      }

      const { displayName, participantId } = parsed.data;
      const room = roomManager.createRoom(displayName, socket.id, participantId);
      socket.join(room.roomId);

      callback?.({ success: true, room });
      logger.info(`Socket ${socket.id} created and joined room ${room.roomId}`);
    } catch (err: any) {
      logger.error('Error in room:create', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Join Room
  socket.on('room:join', (data, callback) => {
    try {
      const parsed = joinRoomSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid input' });
      }

      const { roomId, displayName, participantId } = parsed.data;
      const result = roomManager.joinRoom(roomId.toUpperCase().trim(), displayName, socket.id, participantId);

      if (!result.success || !result.room || !result.participant) {
        return callback?.({ success: false, error: result.error || 'Unable to join room' });
      }

      socket.join(result.room.roomId);

      // System chat announcement
      const joinMsg = roomManager.addChatMessage(
        result.room.roomId,
        'system',
        'CineMate Bot',
        `${result.participant.displayName} joined the room 👋`,
        true
      );

      // Notify others in room
      socket.to(result.room.roomId).emit('room:participant-joined', {
        participant: result.participant,
        systemMessage: joinMsg,
      });

      callback?.({ success: true, room: result.room, participant: result.participant });
      logger.info(`Socket ${socket.id} joined room ${result.room.roomId}`);
    } catch (err: any) {
      logger.error('Error in room:join', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Load Media
  socket.on('media:load', (data, callback) => {
    try {
      const parsed = mediaLoadSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid media input' });
      }

      const participant = roomManager.getParticipantBySocket(socket.id);
      if (!participant) {
        return callback?.({ success: false, error: 'Participant not recognized' });
      }

      const { roomId, mediaUrl, mediaProvider } = parsed.data;
      const result = roomManager.setMedia(roomId, participant.participantId, mediaUrl, mediaProvider);

      if (!result.success) {
        return callback?.({ success: false, error: result.error });
      }

      const mediaMsg = roomManager.addChatMessage(
        roomId,
        'system',
        'CineMate Bot',
        `${participant.displayName} loaded new media (${mediaProvider})`,
        true
      );

      // Broadcast to all participants in room including sender
      io.in(roomId).emit('media:loaded', {
        mediaUrl,
        mediaProvider,
        playbackState: roomManager.getRoom(roomId)?.playbackState,
        systemMessage: mediaMsg,
      });

      callback?.({ success: true });
    } catch (err: any) {
      logger.error('Error in media:load', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Leave Room
  socket.on('room:leave', (callback) => {
    try {
      const { roomId, participant, roomEmpty } = roomManager.leaveRoom(socket.id);
      if (roomId) {
        socket.leave(roomId);
        if (!roomEmpty && participant) {
          const leaveMsg = roomManager.addChatMessage(
            roomId,
            'system',
            'CineMate Bot',
            `${participant.displayName} left the room`,
            true
          );
          io.in(roomId).emit('room:participant-left', {
            participantId: participant.participantId,
            systemMessage: leaveMsg,
            room: roomManager.getRoom(roomId),
          });
        }
      }
      callback?.({ success: true });
    } catch (err: any) {
      logger.error('Error in room:leave', err);
      callback?.({ success: false });
    }
  });
}
