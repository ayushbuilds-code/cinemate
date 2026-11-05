export type MediaProviderType = 'youtube' | 'vimeo' | 'html5' | 'embed' | 'none';

export type PlaybackAction = 'play' | 'pause' | 'seek' | 'state' | 'sync-request' | 'sync-response';

export interface Participant {
  socketId: string;
  participantId: string;
  displayName: string;
  role: 'host' | 'guest';
  joinedAt: number;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  hasCamera?: boolean;
  hasMic?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  lastUpdatedAt: number;
  sequenceNumber: number;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  participants: Participant[];
  mediaUrl: string;
  mediaProvider: MediaProviderType;
  playbackState: PlaybackState;
  messages: ChatMessage[];
  createdAt: number;
}

export interface PlaybackEventPayload {
  roomId: string;
  mediaId?: string;
  action: PlaybackAction;
  currentTime: number;
  playbackRate: number;
  timestamp: number;
  senderId: string;
  sequenceNumber: number;
}

