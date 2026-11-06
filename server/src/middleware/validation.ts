import { z } from 'zod';

export const createRoomSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(32, 'Display name too long'),
  participantId: z.string().min(1, 'Participant ID is required'),
});

export const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(16),
  displayName: z.string().min(1, 'Display name is required').max(32),
  participantId: z.string().min(1, 'Participant ID is required'),
});

export const mediaLoadSchema = z.object({
  roomId: z.string().min(1),
  mediaUrl: z.string().url('Invalid media URL').refine((url) => {
    // Only allow http/https
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are permitted'),
  mediaProvider: z.enum(['youtube', 'vimeo', 'html5', 'embed', 'none']),
});

export const playbackEventSchema = z.object({
  roomId: z.string().min(1),
  mediaId: z.string().optional(),
  action: z.enum(['play', 'pause', 'seek', 'state', 'sync-request', 'sync-response', 'buffer-start', 'buffer-end', 'coordinated-play']),
  currentTime: z.number().min(0),
  playbackRate: z.number().min(0.25).max(4).default(1),
  timestamp: z.number(),
  senderId: z.string().min(1),
  sequenceNumber: z.number(),
  startAtMs: z.number().optional(),
});

export const chatMessageSchema = z.object({
  roomId: z.string().min(1),
  text: z.string().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
});

export const webrtcSignalSchema = z.object({
  roomId: z.string().min(1),
  targetSocketId: z.string().optional(),
  payload: z.any(),
});

