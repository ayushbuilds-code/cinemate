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

      // ───────────────────────────────────────────────────────────────────────
      // Handle buffer-start: one participant started buffering → pause everyone
      // ───────────────────────────────────────────────────────────────────────
      if (payload.action === 'buffer-start') {
        roomManager.setParticipantBuffering(payload.roomId, participant.participantId, true);

        // Broadcast force-pause to ALL participants (including sender) so both sides pause
        const forcePausePayload = {
          ...payload,
          action: 'pause' as const,
          senderId: 'server', // mark as server-originated to avoid echo filtering on client
          sequenceNumber: payload.sequenceNumber,
        };
        io.to(payload.roomId).emit('playback:sync', forcePausePayload);

        logger.info(`Room ${payload.roomId}: participant ${participant.participantId} buffering — force-paused all`);
        return callback?.({ success: true });
      }

      // ───────────────────────────────────────────────────────────────────────
      // Handle buffer-end: participant finished buffering → check if all ready
      // ───────────────────────────────────────────────────────────────────────
      if (payload.action === 'buffer-end') {
        const allReady = roomManager.setParticipantBuffering(payload.roomId, participant.participantId, false);

        if (allReady) {
          // Both participants are ready — emit a coordinated-play command
          // with a future start time 800ms from now so both clients have time to prepare
          const startAtMs = Date.now() + 800;
          const coordinatedPayload = {
            ...payload,
            action: 'coordinated-play' as const,
            senderId: 'server',
            startAtMs,
            sequenceNumber: payload.sequenceNumber + 1,
          };

          // Update server playback state to isPlaying = true
          room.playbackState.isPlaying = true;
          room.playbackState.lastUpdatedAt = startAtMs;
          room.playbackState.currentTime = payload.currentTime;

          io.to(payload.roomId).emit('playback:sync', coordinatedPayload);
          logger.info(`Room ${payload.roomId}: all ready — emitting coordinated-play at ${startAtMs}`);
        } else {
          logger.info(`Room ${payload.roomId}: participant ${participant.participantId} ready, waiting for others`);
        }

        return callback?.({ success: true });
      }

      // ───────────────────────────────────────────────────────────────────────
      // Standard play / pause / seek actions
      // ───────────────────────────────────────────────────────────────────────
      const updateResult = roomManager.updatePlaybackState(payload.roomId, participant.participantId, payload);
      if (!updateResult.success) {
        logger.warn(`Playback update rejected: ${updateResult.error}`);
        return callback?.({ success: false, error: updateResult.error });
      }

      // Broadcast to OTHER participant(s) only — the sender already applied the action locally
      socket.to(payload.roomId).emit('playback:sync', payload);

      callback?.({ success: true, playbackState: room.playbackState });
    } catch (err: any) {
      logger.error('Error in playback:action', err);
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Client requests authoritative sync state (periodic drift correction)
  socket.on('playback:request-sync', (data, callback) => {
    try {
      const room = roomManager.getRoom(data?.roomId);
      if (!room) {
        return callback?.({ success: false, error: 'Room not found' });
      }

      // Compute elapsed time since state was last updated
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
