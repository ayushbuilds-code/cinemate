import { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/roomManager.js';
import { playbackEventSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

export function setupPlaybackEvents(io: Server, socket: Socket) {
  socket.on('playback:action', (data, callback) => {
    try {
      const parsed = playbackEventSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid playback payload' });
      }

      const payload = parsed.data;
      const participant = roomManager.getParticipantBySocket(socket.id);
      if (!participant) {
        return callback?.({ success: false, error: 'Unauthorized participant' });
      }

      const room = roomManager.getRoom(payload.roomId);
      if (!room) {
        return callback?.({ success: false, error: 'Room not found' });
      }

      // Check permissions: by default host has authoritative control,
      // but if guest initiates, we can allow or validate if host allows shared controls.
      // We will allow either participant to trigger play/pause/seek for responsive collaboration,
      // or prioritize host. Let's update authoritative room playback state.
      const updateResult = roomManager.updatePlaybackState(payload.roomId, participant.participantId, payload);
      if (!updateResult.success) {
        logger.warn(`Playback update rejected: ${updateResult.error}`);
        return callback?.({ success: false, error: updateResult.error });
      }

      // Broadcast playback action to other participant(s) in room
      socket.to(payload.roomId).emit('playback:sync', payload);

      callback?.({ success: true, playbackState: room.playbackState });
    } catch (err: any) {
      logger.error('Error in playback:action', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Client requests authoritative sync state (e.g. upon join or drift)
  socket.on('playback:request-sync', (data, callback) => {
    try {
      const room = roomManager.getRoom(data?.roomId);
      if (!room) {
        return callback?.({ success: false, error: 'Room not found' });
      }

      // If room is playing, compute elapsed drift time since lastUpdatedAt
      let authoritativeTime = room.playbackState.currentTime;
      if (room.playbackState.isPlaying) {
        const elapsedSec = (Date.now() - room.playbackState.lastUpdatedAt) / 1000;
        authoritativeTime += elapsedSec * (room.playbackState.playbackRate || 1);
      }

      callback?.({
        success: true,
        playbackState: {
          ...room.playbackState,
          currentTime: authoritativeTime,
        },
      });
    } catch (err: any) {
      logger.error('Error in playback:request-sync', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });
}
