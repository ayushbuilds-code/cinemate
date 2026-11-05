import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../rooms/roomManager.js';

describe('RoomManager Unit Tests', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  it('creates a room with unique code and assigns host', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    expect(room).toBeDefined();
    expect(room.roomId).toHaveLength(6);
    expect(room.hostId).toBe('user-alice');
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].role).toBe('host');
    expect(room.participants[0].displayName).toBe('Alice');
  });

  it('allows second participant to join as guest', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    const joinResult = manager.joinRoom(room.roomId, 'Bob', 'socket-2', 'user-bob');

    expect(joinResult.success).toBe(true);
    expect(joinResult.room?.participants).toHaveLength(2);
    expect(joinResult.participant?.role).toBe('guest');
  });

  it('rejects a 3rd participant when room is full (max 2 rule)', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    manager.joinRoom(room.roomId, 'Bob', 'socket-2', 'user-bob');
    const thirdResult = manager.joinRoom(room.roomId, 'Charlie', 'socket-3', 'user-charlie');

    expect(thirdResult.success).toBe(false);
    expect(thirdResult.error).toContain('Room is full');
  });

  it('handles reconnecting participant gracefully', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    manager.joinRoom(room.roomId, 'Bob', 'socket-2', 'user-bob');

    // Bob disconnects and reconnects on socket-99
    const reconnectResult = manager.joinRoom(room.roomId, 'Bob', 'socket-99', 'user-bob');
    expect(reconnectResult.success).toBe(true);
    expect(reconnectResult.room?.participants).toHaveLength(2);
    const updatedBob = reconnectResult.room?.participants.find((p) => p.participantId === 'user-bob');
    expect(updatedBob?.socketId).toBe('socket-99');
    expect(updatedBob?.connectionStatus).toBe('connected');
  });

  it('allows host to change media and rejects non-host', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    manager.joinRoom(room.roomId, 'Bob', 'socket-2', 'user-bob');

    // Bob tries to change media -> fails
    const failRes = manager.setMedia(room.roomId, 'user-bob', 'https://example.com/video.mp4', 'html5');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('Only the room host');

    // Alice changes media -> succeeds
    const okRes = manager.setMedia(room.roomId, 'user-alice', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube');
    expect(okRes.success).toBe(true);
    expect(room.mediaUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(room.mediaProvider).toBe('youtube');
  });

  it('updates playback state with sequence number ordering', () => {
    const room = manager.createRoom('Alice', 'socket-1', 'user-alice');
    const update1 = manager.updatePlaybackState(room.roomId, 'user-alice', {
      roomId: room.roomId,
      action: 'play',
      currentTime: 10.5,
      playbackRate: 1,
      timestamp: Date.now(),
      senderId: 'user-alice',
      sequenceNumber: 1,
    });
    expect(update1.success).toBe(true);
    expect(room.playbackState.isPlaying).toBe(true);
    expect(room.playbackState.currentTime).toBe(10.5);

    // Stale sequence number rejected
    const updateStale = manager.updatePlaybackState(room.roomId, 'user-alice', {
      roomId: room.roomId,
      action: 'pause',
      currentTime: 5,
      playbackRate: 1,
      timestamp: Date.now(),
      senderId: 'user-alice',
      sequenceNumber: 0,
    });
    expect(updateStale.success).toBe(false);
    expect(room.playbackState.isPlaying).toBe(true); // still playing
  });
});

