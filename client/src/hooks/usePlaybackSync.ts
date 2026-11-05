import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { IMediaProvider, PlaybackAction, PlaybackEventPayload, PlaybackState } from '../types';

interface UsePlaybackSyncOptions {
  socket: Socket | null;
  roomId: string;
  participantId: string;
  isHost: boolean;
  providerRef: React.MutableRefObject<IMediaProvider | null>;
}

export function usePlaybackSync({ socket, roomId, participantId, isHost, providerRef }: UsePlaybackSyncOptions) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synchronized' | 'syncing' | 'drift-correcting'>('synchronized');
  const [sequenceNumber, setSequenceNumber] = useState<number>(0);

  // Guard against echo loops when receiving remote actions
  const isApplyingRemoteAction = useRef<boolean>(false);
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
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    const time = provider.getCurrentTime();
    setIsPlaying(true);
    provider.play();
    emitPlaybackAction('play', time);
  }, [providerRef, emitPlaybackAction]);

  // User Pause click
  const handlePause = useCallback(() => {
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    const time = provider.getCurrentTime();
    setIsPlaying(false);
    provider.pause();
    emitPlaybackAction('pause', time);
  }, [providerRef, emitPlaybackAction]);

  // User Seek click
  const handleSeek = useCallback((time: number) => {
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    setCurrentTime(time);
    provider.seekTo(time);
    emitPlaybackAction('seek', time);
  }, [providerRef, emitPlaybackAction]);

  // Periodic drift correction & authoritative sync check (every 1.5 seconds)
  useEffect(() => {
    if (!socket || !roomId) return;

    const interval = setInterval(() => {
      const provider = providerRef.current;
      if (!provider) return;

      const now = Date.now();
      if (now - lastSyncCheckRef.current > 1500 && !isApplyingRemoteAction.current) {
        lastSyncCheckRef.current = now;
        socket.emit('playback:request-sync', { roomId }, (res: { success: boolean; playbackState?: PlaybackState }) => {
          if (res?.success && res.playbackState) {
            const authoritative = res.playbackState;
            const currentLocal = provider.getCurrentTime();

            // Calculate drift
            const drift = Math.abs(currentLocal - authoritative.currentTime);

            // 1. If host paused, guest MUST pause immediately
            if (!authoritative.isPlaying && (provider.isPlaying() || isPlaying)) {
              isApplyingRemoteAction.current = true;
              provider.pause();
              setIsPlaying(false);
              if (drift > 0.5) {
                provider.seekTo(authoritative.currentTime);
                setCurrentTime(authoritative.currentTime);
              }
              setTimeout(() => { isApplyingRemoteAction.current = false; }, 400);
              return;
            }

            // 2. If host is playing and guest is paused or stopped, resume
            if (authoritative.isPlaying && !provider.isPlaying()) {
              isApplyingRemoteAction.current = true;
              setIsPlaying(true);
              if (drift > 1.0) {
                provider.seekTo(authoritative.currentTime);
                setCurrentTime(authoritative.currentTime);
              }
              provider.play();
              setTimeout(() => { isApplyingRemoteAction.current = false; }, 400);
              return;
            }

            // 3. Drift correction while both are playing: if difference > 1.2s, align timestamps
            if (drift > 1.2 && authoritative.currentTime > 0) {
              setSyncStatus('drift-correcting');
              provider.seekTo(authoritative.currentTime);
              setCurrentTime(authoritative.currentTime);
              setTimeout(() => setSyncStatus('synchronized'), 1000);
            }
          }
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [socket, roomId, providerRef, isPlaying]);

  // Listen to remote playback sync events from peer/host
  useEffect(() => {
    if (!socket) return;

    const onPlaybackSync = async (payload: PlaybackEventPayload) => {
      if (payload.senderId === participantId) {
        return; // Ignore our own echo
      }

      const provider = providerRef.current;
      if (!provider) return;

      setSyncStatus('syncing');
      isApplyingRemoteAction.current = true;

      try {
        if (payload.action === 'play') {
          setIsPlaying(true);
          const cur = provider.getCurrentTime();
          // Seek to exact synchronized timestamp if drift > 0.6s
          if (Math.abs(cur - payload.currentTime) > 0.6) {
            await provider.seekTo(payload.currentTime);
            setCurrentTime(payload.currentTime);
          }
          await provider.play();
        } else if (payload.action === 'pause') {
          // Immediately pause the player!
          setIsPlaying(false);
          await provider.pause();
          if (Math.abs(provider.getCurrentTime() - payload.currentTime) > 0.5) {
            await provider.seekTo(payload.currentTime);
            setCurrentTime(payload.currentTime);
          }
        } else if (payload.action === 'seek') {
          setCurrentTime(payload.currentTime);
          await provider.seekTo(payload.currentTime);
        }
      } catch (err) {
        console.error('Error applying remote playback sync:', err);
      } finally {
        setTimeout(() => {
          isApplyingRemoteAction.current = false;
          setSyncStatus('synchronized');
        }, 500);
      }
    };

    socket.on('playback:sync', onPlaybackSync);

    return () => {
      socket.off('playback:sync', onPlaybackSync);
    };
  }, [socket, participantId, providerRef]);

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
