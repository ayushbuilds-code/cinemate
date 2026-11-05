import { RoomState, Participant, MediaProviderType, ChatMessage, PlaybackEventPayload } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  // Map socketId -> { roomId, participantId }
  private socketMap: Map<string, { roomId: string; participantId: string }> = new Map();

  public generateRoomId(): string {
    // Generate clean, readable 8-character code: e.g. CINE-8942 or 6 uppercase chars
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomId();
    }
    return code;
  }

  public createRoom(hostDisplayName: string, socketId: string, participantId: string): RoomState {
    const roomId = this.generateRoomId();
    const host: Participant = {
      socketId,
      participantId,
      displayName: hostDisplayName.trim() || 'Host',
      role: 'host',
      joinedAt: Date.now(),
      connectionStatus: 'connected',
    };

    const room: RoomState = {
      roomId,
      hostId: participantId,
      participants: [host],
      mediaUrl: '',
      mediaProvider: 'none',
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1,
        lastUpdatedAt: Date.now(),
        sequenceNumber: 0,
      },
      messages: [],
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.socketMap.set(socketId, { roomId, participantId });

    logger.info(`Room created: ${roomId} by host ${host.displayName} (${participantId})`);
    return room;
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomBySocket(socketId: string): RoomState | undefined {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return undefined;
    return this.rooms.get(mapping.roomId);
  }

  public getParticipantBySocket(socketId: string): Participant | undefined {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return undefined;
    const room = this.rooms.get(mapping.roomId);
    if (!room) return undefined;
    return room.participants.find((p) => p.socketId === socketId || p.participantId === mapping.participantId);
  }

  public joinRoom(
    roomId: string,
    displayName: string,
    socketId: string,
    participantId: string
  ): { success: boolean; error?: string; room?: RoomState; participant?: Participant } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room does not exist' };
    }

    // Check if this participant is reconnecting
    const existingIndex = room.participants.findIndex((p) => p.participantId === participantId);
    if (existingIndex !== -1) {
      // Reconnection
      const participant = room.participants[existingIndex];
      // remove old socket mapping if exists
      if (participant.socketId) {
        this.socketMap.delete(participant.socketId);
      }
      participant.socketId = socketId;
      participant.connectionStatus = 'connected';
      if (displayName) participant.displayName = displayName.trim();

      this.socketMap.set(socketId, { roomId, participantId });
      logger.info(`Participant ${participant.displayName} reconnected to room ${roomId}`);
      return { success: true, room, participant };
    }

    // Check capacity limit
    const activeParticipants = room.participants.filter((p) => p.connectionStatus === 'connected');
    if (activeParticipants.length >= 2) {
      return { success: false, error: 'Room is full (max 2 participants)' };
    }

    const participant: Participant = {
      socketId,
      participantId,
      displayName: displayName.trim() || 'Guest',
      role: room.participants.length === 0 ? 'host' : 'guest',
      joinedAt: Date.now(),
      connectionStatus: 'connected',
    };

    if (room.participants.length === 0) {
      room.hostId = participantId;
    }

    room.participants.push(participant);
    this.socketMap.set(socketId, { roomId, participantId });
    logger.info(`Participant ${participant.displayName} joined room ${roomId}`);
    return { success: true, room, participant };
  }

  public setMedia(roomId: string, participantId: string, mediaUrl: string, mediaProvider: MediaProviderType): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    // By default, only host can change media unless permitted
    const participant = room.participants.find((p) => p.participantId === participantId);
    if (!participant || participant.role !== 'host') {
      return { success: false, error: 'Only the room host can change the media source' };
    }

    room.mediaUrl = mediaUrl;
    room.mediaProvider = mediaProvider;
    room.playbackState = {
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1,
      lastUpdatedAt: Date.now(),
      sequenceNumber: room.playbackState.sequenceNumber + 1,
    };

    logger.info(`Room ${roomId} media changed to ${mediaUrl} (${mediaProvider})`);
    return { success: true };
  }

  public updatePlaybackState(roomId: string, participantId: string, payload: PlaybackEventPayload): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const participant = room.participants.find((p) => p.participantId === participantId);
    if (!participant) return { success: false, error: 'Participant not in room' };

    // Check sequence number to ignore stale updates
    if (payload.sequenceNumber <= room.playbackState.sequenceNumber && payload.action !== 'sync-request') {
      // allow sync-response or higher seq
      if (payload.sequenceNumber < room.playbackState.sequenceNumber) {
        return { success: false, error: 'Stale playback event' };
      }
    }

    const isPlaying = payload.action === 'play' ? true : payload.action === 'pause' ? false : room.playbackState.isPlaying;

    room.playbackState = {
      isPlaying,
      currentTime: payload.currentTime,
      playbackRate: payload.playbackRate || 1,
      lastUpdatedAt: Date.now(),
      sequenceNumber: payload.sequenceNumber,
    };

    return { success: true };
  }

  public addChatMessage(roomId: string, senderId: string, senderName: string, text: string, isSystem = false): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message: ChatMessage = {
      id: uuidv4(),
      roomId,
      senderId,
      senderName,
      text,
      timestamp: Date.now(),
      isSystem,
    };

    room.messages.push(message);
    // Keep last 150 messages in memory
    if (room.messages.length > 150) {
      room.messages.shift();
    }

    return message;
  }

  public handleDisconnect(socketId: string): { roomId?: string; participant?: Participant; roomEmpty?: boolean } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return {};

    const { roomId, participantId } = mapping;
    this.socketMap.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return {};

    const participant = room.participants.find((p) => p.participantId === participantId);
    if (participant) {
      participant.connectionStatus = 'disconnected';
      logger.info(`Participant ${participant.displayName} disconnected from room ${roomId}`);
    }

    // Check active participants
    const activeRemaining = room.participants.filter((p) => p.connectionStatus === 'connected');
    if (activeRemaining.length === 0) {
      // Ephemeral: destroy room after short grace period or if empty
      logger.info(`Room ${roomId} has no active participants. Cleaning up.`);
      this.rooms.delete(roomId);
      return { roomId, participant, roomEmpty: true };
    } else {
      // If host disconnected, promote the remaining participant to host
      if (participant && participant.role === 'host') {
        const nextHost = activeRemaining[0];
        nextHost.role = 'host';
        room.hostId = nextHost.participantId;
        logger.info(`Host disconnected. Promoted ${nextHost.displayName} to host in room ${roomId}`);
      }
    }

    return { roomId, participant, roomEmpty: false };
  }

  public leaveRoom(socketId: string): { roomId?: string; participant?: Participant; roomEmpty?: boolean } {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return {};

    const { roomId, participantId } = mapping;
    this.socketMap.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return {};

    const pIndex = room.participants.findIndex((p) => p.participantId === participantId);
    let participant: Participant | undefined;
    if (pIndex !== -1) {
      participant = room.participants[pIndex];
      room.participants.splice(pIndex, 1);
      logger.info(`Participant ${participant.displayName} explicitly left room ${roomId}`);
    }

    if (room.participants.length === 0) {
      this.rooms.delete(roomId);
      return { roomId, participant, roomEmpty: true };
    }

    // If host left, promote next
    if (participant && participant.role === 'host' && room.participants.length > 0) {
      room.participants[0].role = 'host';
      room.hostId = room.participants[0].participantId;
    }

    return { roomId, participant, roomEmpty: false };
  }
}

export const roomManager = new RoomManager();

