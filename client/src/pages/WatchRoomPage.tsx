import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { usePlaybackSync } from '../hooks/usePlaybackSync';
import { RoomHeader } from '../components/room/RoomHeader';
import { MoviePlayer } from '../components/movie/MoviePlayer';
import { MovieUrlInput } from '../components/movie/MovieUrlInput';
import { VideoCallPanel } from '../components/video/VideoCallPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { IMediaProvider, Participant, RoomState, ChatMessage } from '../types';
import { MediaProviderFactory } from '../services/media/MediaProviderFactory';
import { Loader2, AlertCircle } from 'lucide-react';

export const WatchRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { socket, isConnected, participantId } = useSocket();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [floatingReaction, setFloatingReaction] = useState<{ emoji: string; id: number } | null>(null);

  const providerRef = useRef<IMediaProvider | null>(null);

  const cleanRoomId = (roomId || '').toUpperCase();

  // Find participants
  const currentParticipant = room?.participants.find((p) => p.participantId === participantId) || null;
  const isHost = currentParticipant?.role === 'host';
  const remoteParticipant = room?.participants.find((p) => p.participantId !== participantId) || null;

  // WebRTC Hook
  const {
    callStatus,
    localStream,
    remoteStream,
    isCameraOn,
    isMicOn,
    remoteCameraOn,
    remoteMicOn,
    errorMessage: webrtcError,
    startCall,
    endCall,
    toggleCamera,
    toggleMic,
  } = useWebRTC({
    socket,
    roomId: cleanRoomId,
  });

  // Playback Sync Hook
  const {
    isPlaying,
    currentTime,
    duration,
    syncStatus,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    handlePlay,
    handlePause,
    handleSeek,
  } = usePlaybackSync({
    socket,
    roomId: cleanRoomId,
    participantId,
    isHost,
    provider: providerRef.current,
  });

  // Connect & Join Room on mount or reconnect
  useEffect(() => {
    if (!socket || !cleanRoomId) return;

    let savedName = localStorage.getItem('cinemate_display_name') || 'Guest';

    socket.emit(
      'room:join',
      {
        roomId: cleanRoomId,
        displayName: savedName,
        participantId,
      },
      (res: { success: boolean; room?: RoomState; participant?: Participant; error?: string }) => {
        setLoading(false);
        if (res.success && res.room) {
          setRoom(res.room);
          setMessages(res.room.messages || []);
          if (res.room.playbackState) {
            setIsPlaying(res.room.playbackState.isPlaying);
            setCurrentTime(res.room.playbackState.currentTime);
          }
        } else {
          setJoinError(res.error || 'Failed to join room');
        }
      }
    );
  }, [socket, cleanRoomId, participantId]);

  // Socket Room Event Handlers
  useEffect(() => {
    if (!socket) return;

    // Participant joined
    const onParticipantJoined = (data: { participant: Participant; systemMessage: ChatMessage }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.participants.some((p) => p.participantId === data.participant.participantId);
        const updatedParticipants = exists
          ? prev.participants.map((p) => (p.participantId === data.participant.participantId ? data.participant : p))
          : [...prev.participants, data.participant];
        return { ...prev, participants: updatedParticipants };
      });

      if (data.systemMessage) {
        setMessages((prev) => [...prev, data.systemMessage]);
      }
    };

    // Participant left
    const onParticipantLeft = (data: { participantId: string; systemMessage: ChatMessage; room?: RoomState }) => {
      if (data.room) {
        setRoom(data.room);
      } else {
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.filter((p) => p.participantId !== data.participantId),
          };
        });
      }

      if (data.systemMessage) {
        setMessages((prev) => [...prev, data.systemMessage]);
      }
    };

    // Media loaded
    const onMediaLoaded = (data: { mediaUrl: string; mediaProvider: any; playbackState: any; systemMessage: ChatMessage }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mediaUrl: data.mediaUrl,
          mediaProvider: data.mediaProvider,
          playbackState: data.playbackState,
        };
      });

      if (data.systemMessage) {
        setMessages((prev) => [...prev, data.systemMessage]);
      }
    };

    // Chat message received
    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Emoji reaction received
    const onReactionReceived = (data: { emoji: string; senderName: string }) => {
      // Trigger floating reaction and subtle confetti
      setFloatingReaction({ emoji: data.emoji, id: Date.now() });
      if (data.emoji === '🎉' || data.emoji === '🔥') {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      }
      setTimeout(() => setFloatingReaction(null), 2500);
    };

    socket.on('room:participant-joined', onParticipantJoined);
    socket.on('room:participant-left', onParticipantLeft);
    socket.on('media:loaded', onMediaLoaded);
    socket.on('chat:message', onChatMessage);
    socket.on('reaction:received', onReactionReceived);

    return () => {
      socket.off('room:participant-joined', onParticipantJoined);
      socket.off('room:participant-left', onParticipantLeft);
      socket.off('media:loaded', onMediaLoaded);
      socket.off('chat:message', onChatMessage);
      socket.off('reaction:received', onReactionReceived);
    };
  }, [socket]);

  // Load new media URL
  const handleLoadMediaUrl = (url: string) => {
    if (!socket || !cleanRoomId) return;

    const detected = MediaProviderFactory.detectProvider(url);

    socket.emit(
      'media:load',
      {
        roomId: cleanRoomId,
        mediaUrl: url,
        mediaProvider: detected,
      },
      (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          alert(res.error || 'Failed to load video');
        }
      }
    );
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    if (!socket || !cleanRoomId) return;
    socket.emit('chat:send', { roomId: cleanRoomId, text });
  };

  // Reaction send
  const handleSendReaction = (emoji: string) => {
    if (!socket || !cleanRoomId) return;
    socket.emit('reaction:send', { roomId: cleanRoomId, emoji });
  };

  // Leave room
  const handleLeaveRoom = () => {
    endCall();
    if (socket) {
      socket.emit('room:leave');
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090F] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <h3 className="text-base font-semibold text-white">Entering Watch Room...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting real-time synchronization channels</p>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-[#09090F] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to Join Room</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{joinError}</p>
        <button
          onClick={() => navigate('/join')}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all"
        >
          Back to Join Room
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090F] text-[#F8FAFC] flex flex-col selection:bg-purple-500/30">
      {/* Top Bar Header */}
      <RoomHeader
        roomId={cleanRoomId}
        participantCount={room?.participants.length || 1}
        isHost={isHost}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Floating Animated Reaction */}
      {floatingReaction && (
        <div className="fixed bottom-24 right-1/4 z-50 text-5xl animate-bounce pointer-events-none select-none">
          {floatingReaction.emoji}
        </div>
      )}

      {/* Main Spacious Cinema Watch Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT SECTION — Expanded Movie Player (Col span 8 on xl) */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            {/* The Synchronized Movie Player */}
            <MoviePlayer
              mediaUrl={room?.mediaUrl || ''}
              mediaProvider={room?.mediaProvider || 'none'}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              syncStatus={syncStatus}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onDurationChange={setDuration}
              onTimeUpdate={setCurrentTime}
              isHost={isHost}
              providerRef={providerRef}
            />

            {/* Movie URL Input & Quick Presets Bar */}
            <MovieUrlInput
              onLoadUrl={handleLoadMediaUrl}
              canLoad={isHost || true}
            />
          </div>

          {/* RIGHT SECTION — Video Call & Live Chat (Col span 4 on xl) */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            {/* Real-Time Peer-to-Peer Video Call */}
            <VideoCallPanel
              callStatus={callStatus}
              localStream={localStream}
              remoteStream={remoteStream}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              remoteCameraOn={remoteCameraOn}
              remoteMicOn={remoteMicOn}
              errorMessage={webrtcError}
              currentParticipant={currentParticipant}
              remoteParticipant={remoteParticipant}
              onStartCall={startCall}
              onEndCall={endCall}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
            />

            {/* Real-Time Chat & Emoji Bar */}
            <ChatPanel
              socket={socket}
              roomId={cleanRoomId}
              currentParticipantId={participantId}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendReaction={handleSendReaction}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

