import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { IMediaProvider, PlaybackAction, PlaybackEventPayload, PlaybackState } from '../types';

interface UsePlaybackSyncOptions {
  socket: Socket | null;
  roomId: string;
  participantId: string;
  isHost: boolean;
  provider: IMediaProvider | null;
}

export function usePlaybackSync({ socket, roomId, participantId, isHost, provider }: UsePlaybackSyncOptions) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synchronized' | 'syncing' | 'drift-correcting'>('synchronized');
  const [sequenceNumber, setSequenceNumber] = useState<number>(0);

  const isLocalActionRef = useRef<boolean>(false);
  const lastSyncCheckRef = useRef<number>(0);

  // Send action to socket
  const emitPlaybackAction = useCallback((action: PlaybackAction, targetTime: number) => {
    if (!socket || !roomId) return;

    setSequenceNumber((prevSeq) => {
      const nextSeq = prevSeq + 1;
      const payload: PlaybackEventPayload = {
        roomId,
        action,
        currentTime: targetTime,
        playbackRate: 1,
        timestamp: Date.now(),
        senderId: participantId,
        sequenceNumber: nextSeq,
      };

      socket.emit('playback:action', payload);
      return nextSeq;
    });
  }, [socket, roomId, participantId]);

  // User Play click
  const handlePlay = useCallback(() => {
    if (!provider) return;
    isLocalActionRef.current = true;
    const time = provider.getCurrentTime();
    setIsPlaying(true);
    provider.play();
    emitPlaybackAction('play', time);
    setTimeout(() => { isLocalActionRef.current = false; }, 300);
  }, [provider, emitPlaybackAction]);

  // User Pause click
  const handlePause = useCallback(() => {
    if (!provider) return;
    isLocalActionRef.current = true;
    const time = provider.getCurrentTime();
    setIsPlaying(false);
    provider.pause();
    emitPlaybackAction('pause', time);
    setTimeout(() => { isLocalActionRef.current = false; }, 300);
  }, [provider, emitPlaybackAction]);

  // User Seek click
  const handleSeek = useCallback((time: number) => {
    if (!provider) return;
    isLocalActionRef.current = true;
    setCurrentTime(time);
    provider.seekTo(time);
    emitPlaybackAction('seek', time);
    setTimeout(() => { isLocalActionRef.current = false; }, 300);
  }, [provider, emitPlaybackAction]);

  // Periodic drift correction for guest or sync audit
  useEffect(() => {
    if (!provider || !socket || !roomId) return;

    const interval = setInterval(() => {
      // Periodically check drift if playing
      const now = Date.now();
      if (now - lastSyncCheckRef.current > 4000) {
        lastSyncCheckRef.current = now;
        socket.emit('playback:request-sync', { roomId }, (res: { success: boolean; playbackState?: PlaybackState }) => {
          if (res?.success && res.playbackState) {
            const authoritative = res.playbackState;
            const currentLocal = provider.getCurrentTime();
            const drift = Math.abs(currentLocal - authoritative.currentTime);

            // Large drift > 2 seconds -> Seek to authoritative position
            if (drift > 2.0 && authoritative.currentTime > 0) {
              setSyncStatus('drift-correcting');
              provider.seekTo(authoritative.currentTime);
              setTimeout(() => setSyncStatus('synchronized'), 1000);
            }

            // Sync play state if mismatched
            if (authoritative.isPlaying && !provider.isPlaying()) {
              provider.play();
              setIsPlaying(true);
            } else if (!authoritative.isPlaying && provider.isPlaying()) {
              provider.pause();
              setIsPlaying(false);
            }
          }
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [provider, socket, roomId]);

  // Listen to remote playback sync events
  useEffect(() => {
    if (!socket || !provider) return;

    const onPlaybackSync = async (payload: PlaybackEventPayload) => {
      if (payload.senderId === participantId) {
        return; // Ignore echo
      }

      setSyncStatus('syncing');

      if (payload.action === 'play') {
        setIsPlaying(true);
        // If drift is significant, seek first
        const cur = provider.getCurrentTime();
        if (Math.abs(cur - payload.currentTime) > 1.0) {
          await provider.seekTo(payload.currentTime);
        }
        await provider.play();
      } else if (payload.action === 'pause') {
        setIsPlaying(false);
        await provider.pause();
        if (Math.abs(provider.getCurrentTime() - payload.currentTime) > 1.0) {
          await provider.seekTo(payload.currentTime);
        }
      } else if (payload.action === 'seek') {
        setCurrentTime(payload.currentTime);
        await provider.seekTo(payload.currentTime);
      }

      setTimeout(() => setSyncStatus('synchronized'), 800);
    };

    socket.on('playback:sync', onPlaybackSync);

    return () => {
      socket.off('playback:sync', onPlaybackSync);
    };
  }, [socket, provider, participantId]);

  return {
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
  };
}

