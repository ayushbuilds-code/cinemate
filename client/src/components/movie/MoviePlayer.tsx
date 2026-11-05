import React, { useEffect, useRef, useState } from 'react';
import { Film, AlertTriangle, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { IMediaProvider, MediaProviderType } from '../../types';
import { MediaProviderFactory } from '../../services/media/MediaProviderFactory';
import { PlaybackControls } from './PlaybackControls';

interface MoviePlayerProps {
  mediaUrl: string;
  mediaProvider: MediaProviderType;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  syncStatus: 'synchronized' | 'syncing' | 'drift-correcting';
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  isHost: boolean;
  providerRef: React.MutableRefObject<IMediaProvider | null>;
}

export const MoviePlayer: React.FC<MoviePlayerProps> = ({
  mediaUrl,
  mediaProvider,
  isPlaying,
  currentTime,
  duration,
  syncStatus,
  onPlay,
  onPause,
  onSeek,
  onDurationChange,
  onTimeUpdate,
  isHost,
  providerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Provider when mediaUrl changes
  useEffect(() => {
    if (!mediaUrl || !containerRef.current) {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      return;
    }

    let active = true;
    setIsLoading(true);
    setErrorMessage(null);

    // Destroy existing provider instance
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }

    const providerInstance = MediaProviderFactory.createProvider(mediaProvider);
    if (!providerInstance) {
      setIsLoading(false);
      setErrorMessage('Unsupported video source.');
      return;
    }

    providerRef.current = providerInstance;

    providerInstance
      .load(mediaUrl, containerRef.current, {
        onPlay: (time) => {
          if (!active) return;
          onPlay();
        },
        onPause: (time) => {
          if (!active) return;
          onPause();
        },
        onSeek: (time) => {
          if (!active) return;
          onSeek(time);
        },
        onTimeUpdate: (time) => {
          if (!active) return;
          onTimeUpdate(time);
        },
        onDurationChange: (dur) => {
          if (!active) return;
          onDurationChange(dur);
        },
        onReady: () => {
          if (!active) return;
          setIsLoading(false);
          // If room state says it was playing or at a time, seek immediately
          if (currentTime > 0) {
            providerInstance.seekTo(currentTime);
          }
          if (isPlaying) {
            providerInstance.play();
          }
        },
        onError: (err) => {
          if (!active) return;
          setIsLoading(false);
          setErrorMessage(err);
        },
      })
      .catch((err) => {
        if (!active) return;
        setIsLoading(false);
        setErrorMessage(err.message || 'Error loading media provider');
      });

    return () => {
      active = false;
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [mediaUrl, mediaProvider]);

  const toggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={playerWrapperRef}
      className="relative w-full rounded-2xl overflow-hidden bg-[#11111B] border border-slate-800 flex flex-col shadow-2xl group"
    >
      {/* Viewport Screen */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#09090F]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Synchronizing media stream...</p>
          </div>
        )}

        {/* Error Fallback */}
        {errorMessage && (
          <div className="absolute inset-0 bg-[#11111B]/95 z-30 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Unable to Play Video</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{errorMessage}</p>
            <div className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
              Tip: Try one of the test direct MP4 sample links below the player!
            </div>
          </div>
        )}

        {/* Empty Placeholder when no video loaded */}
        {!mediaUrl && (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-inner">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">No Movie Loaded Yet</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Paste any YouTube link, Vimeo video, or direct MP4/WebM video URL in the bar below to begin your synchronized watch session.
            </p>
          </div>
        )}

        {/* The DOM element where YouTube/HTML5/Vimeo attaches */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Controls Bar */}
      {mediaUrl && (
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          syncStatus={syncStatus}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onToggleFullscreen={toggleFullscreen}
          canControl={true}
        />
      )}
    </div>
  );
};

