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

  // Monotonically increasing sequence number for event ordering
  const sequenceNumberRef = useRef<number>(0);

  // Guard: set true while we're applying a remote command so our own provider
  // callbacks (if any) don't re-emit to the server and create an echo loop.
  const isApplyingRemoteAction = useRef<boolean>(false);

  // Guard: set true when this client is currently buffering.
  // The server pauses everyone until buffering clears.
  const isBufferingRef = useRef<boolean>(false);

  // Drift sync interval handle
  const driftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to get next sequence number
  const nextSeq = () => {
    sequenceNumberRef.current += 1;
    return sequenceNumberRef.current;
  };

  // Send a playback action to the server
  const emitPlaybackAction = useCallback((action: PlaybackAction, targetTime: number, extra?: Partial<PlaybackEventPayload>) => {
    if (!socket || !roomId) return;

    const payload: PlaybackEventPayload = {
      roomId,
      action,
      currentTime: targetTime,
      playbackRate: 1,
      timestamp: Date.now(),
      senderId: participantId,
      sequenceNumber: nextSeq(),
      ...extra,
    };

    socket.emit('playback:action', payload);
  }, [socket, roomId, participantId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // USER-INITIATED ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    const time = provider.getCurrentTime();
    setIsPlaying(true);
    provider.play();
    emitPlaybackAction('play', time);
  }, [providerRef, emitPlaybackAction]);

  const handlePause = useCallback(() => {
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    const time = provider.getCurrentTime();
    setIsPlaying(false);
    provider.pause();
    emitPlaybackAction('pause', time);
  }, [providerRef, emitPlaybackAction]);

  const handleSeek = useCallback((time: number) => {
    const provider = providerRef.current;
    if (!provider || isApplyingRemoteAction.current) return;
    setCurrentTime(time);
    provider.seekTo(time);
    emitPlaybackAction('seek', time);
  }, [providerRef, emitPlaybackAction]);

  // ─────────────────────────────────────────────────────────────────────────────
  // BUFFER EVENTS (called from MoviePlayer via onBuffer / onBufferEnd props)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleBuffer = useCallback(() => {
    if (isBufferingRef.current) return; // already signalled
    isBufferingRef.current = true;

    const provider = providerRef.current;
    const time = provider?.getCurrentTime() ?? currentTime;

    console.log('[CineMate Sync] Local buffering started at', time.toFixed(2));

    // Emit buffer-start: server will force-pause all participants
    emitPlaybackAction('buffer-start', time);
  }, [providerRef, currentTime, emitPlaybackAction]);

  const handleBufferEnd = useCallback(() => {
    if (!isBufferingRef.current) return; // wasn't buffering
    isBufferingRef.current = false;

    const provider = providerRef.current;
    const time = provider?.getCurrentTime() ?? currentTime;

    console.log('[CineMate Sync] Local buffering ended at', time.toFixed(2));

    // Emit buffer-end: server checks if all participants ready, then emits coordinated-play
    emitPlaybackAction('buffer-end', time);
  }, [providerRef, currentTime, emitPlaybackAction]);

  // ─────────────────────────────────────────────────────────────────────────────
  // REMOTE EVENT LISTENER
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const onPlaybackSync = async (payload: PlaybackEventPayload) => {
      // Ignore our own echoes
      if (payload.senderId === participantId) return;

      const provider = providerRef.current;
      if (!provider) return;

      setSyncStatus('syncing');
      isApplyingRemoteAction.current = true;

      try {
        if (payload.action === 'play') {
          setIsPlaying(true);
          const cur = provider.getCurrentTime();
          if (Math.abs(cur - payload.currentTime) > 0.6) {
            await provider.seekTo(payload.currentTime);
            setCurrentTime(payload.currentTime);
          }
          await provider.play();

        } else if (payload.action === 'pause') {
          setIsPlaying(false);
          await provider.pause();
          if (Math.abs(provider.getCurrentTime() - payload.currentTime) > 0.5) {
            await provider.seekTo(payload.currentTime);
            setCurrentTime(payload.currentTime);
          }

        } else if (payload.action === 'seek') {
          setCurrentTime(payload.currentTime);
          await provider.seekTo(payload.currentTime);

        } else if (payload.action === 'buffer-start') {
          // Remote participant is buffering — pause us too
          console.log('[CineMate Sync] Remote buffering — pausing locally');
          setIsPlaying(false);
          await provider.pause();

        } else if (payload.action === 'buffer-end') {
          // Remote participant finished buffering; server decides when to resume
          console.log('[CineMate Sync] Remote buffering ended');

        } else if (payload.action === 'coordinated-play') {
          // Both sides ready. Start at exactly startAtMs.
          const startAtMs = payload.startAtMs ?? Date.now();
          const targetTime = payload.currentTime;
          const delay = Math.max(0, startAtMs - Date.now());

          console.log(`[CineMate Sync] Coordinated play at ${targetTime.toFixed(2)}s in ${delay}ms`);

          await provider.seekTo(targetTime);
          setCurrentTime(targetTime);

          setTimeout(async () => {
            if (!providerRef.current) return;
            // Compensate for the time elapsed since the server set startAtMs
            const elapsed = (Date.now() - startAtMs) / 1000;
            const adjustedTime = targetTime + elapsed;
            if (adjustedTime > targetTime + 0.1) {
              await providerRef.current.seekTo(adjustedTime);
            }
            setIsPlaying(true);
            await providerRef.current.play();
          }, delay);
        }
      } catch (err) {
        console.error('[CineMate Sync] Error applying remote playback event:', err);
      } finally {
        setTimeout(() => {
          isApplyingRemoteAction.current = false;
          setSyncStatus('synchronized');
        }, 500);
      }
    };

    socket.on('playback:sync', onPlaybackSync);
    return () => { socket.off('playback:sync', onPlaybackSync); };
  }, [socket, participantId, providerRef]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PERIODIC DRIFT CORRECTION (every 2s while playing)
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !roomId) return;

    if (driftIntervalRef.current) clearInterval(driftIntervalRef.current);

    driftIntervalRef.current = setInterval(() => {
      const provider = providerRef.current;
      if (!provider || isApplyingRemoteAction.current || isBufferingRef.current) return;

      socket.emit('playback:request-sync', { roomId }, (res: { success: boolean; playbackState?: PlaybackState }) => {
        if (!res?.success || !res.playbackState) return;

        const authoritative = res.playbackState;
        const localTime = provider.getCurrentTime();

        // 1. Server says paused but we're playing → pause
        if (!authoritative.isPlaying && provider.isPlaying()) {
          isApplyingRemoteAction.current = true;
          provider.pause();
          setIsPlaying(false);
          const drift = Math.abs(localTime - authoritative.currentTime);
          if (drift > 0.5) {
            provider.seekTo(authoritative.currentTime);
            setCurrentTime(authoritative.currentTime);
          }
          setTimeout(() => { isApplyingRemoteAction.current = false; }, 400);
          return;
        }

        // 2. Server says playing but we're paused → start playing with sync
        if (authoritative.isPlaying && !provider.isPlaying()) {
          isApplyingRemoteAction.current = true;
          const elapsed = (Date.now() - authoritative.lastUpdatedAt) / 1000;
          const targetTime = authoritative.currentTime + elapsed;
          const drift = Math.abs(localTime - targetTime);
          if (drift > 0.5) {
            provider.seekTo(targetTime);
            setCurrentTime(targetTime);
          }
          provider.play();
          setIsPlaying(true);
          setTimeout(() => { isApplyingRemoteAction.current = false; }, 400);
          return;
        }

        // 3. Both playing but drifted > 1.5s → resync
        if (authoritative.isPlaying && provider.isPlaying()) {
          const elapsed = (Date.now() - authoritative.lastUpdatedAt) / 1000;
          const targetTime = authoritative.currentTime + elapsed;
          const drift = Math.abs(localTime - targetTime);
          if (drift > 1.5) {
            setSyncStatus('drift-correcting');
            provider.seekTo(targetTime);
            setCurrentTime(targetTime);
            setTimeout(() => setSyncStatus('synchronized'), 1000);
          }
        }
      });
    }, 2000);

    return () => {
      if (driftIntervalRef.current) clearInterval(driftIntervalRef.current);
    };
  }, [socket, roomId, providerRef]);

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
    handleBuffer,
    handleBufferEnd,
  };
}
