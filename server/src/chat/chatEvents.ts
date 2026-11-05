import { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/roomManager.js';
import { chatMessageSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

export function setupChatEvents(io: Server, socket: Socket) {
  // Send message
  socket.on('chat:send', (data, callback) => {
    try {
      const parsed = chatMessageSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid chat message' });
      }

      const participant = roomManager.getParticipantBySocket(socket.id);
      if (!participant) {
        return callback?.({ success: false, error: 'Participant not recognized' });
      }

      const { roomId, text } = parsed.data;
      const message = roomManager.addChatMessage(
        roomId,
        participant.participantId,
        participant.displayName,
        text,
        false
      );

      if (!message) {
        return callback?.({ success: false, error: 'Could not send message' });
      }

      // Broadcast to room (including sender)
      io.in(roomId).emit('chat:message', message);
      callback?.({ success: true, message });
    } catch (err: any) {
      logger.error('Error in chat:send', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Typing indicators
  socket.on('chat:typing', (data) => {
    const participant = roomManager.getParticipantBySocket(socket.id);
    if (participant && data?.roomId) {
      socket.to(data.roomId).emit('chat:typing', {
        participantId: participant.participantId,
        displayName: participant.displayName,
      });
    }
  });

  socket.on('chat:stop-typing', (data) => {
    const participant = roomManager.getParticipantBySocket(socket.id);
    if (participant && data?.roomId) {
      socket.to(data.roomId).emit('chat:stop-typing', {
        participantId: participant.participantId,
      });
    }
  });

  // Emoji reactions
  socket.on('reaction:send', (data) => {
    const participant = roomManager.getParticipantBySocket(socket.id);
    if (participant && data?.roomId && data?.emoji) {
      io.in(data.roomId).emit('reaction:received', {
        emoji: data.emoji,
        senderName: participant.displayName,
        senderId: participant.participantId,
      });
    }
  });
}
