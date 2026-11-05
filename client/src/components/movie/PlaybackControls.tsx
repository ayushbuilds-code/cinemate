import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Sparkles, RefreshCw } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  syncStatus: 'synchronized' | 'syncing' | 'drift-correcting';
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onToggleFullscreen: () => void;
  canControl?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  syncStatus,
  onPlay,
  onPause,
  onSeek,
  onToggleFullscreen,
  canControl = true,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControl || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    onSeek(pos * duration);
  };

  return (
    <div className="bg-[#11111B]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-3 rounded-b-2xl flex flex-col gap-2">
      {/* Interactive Progress Bar */}
      <div
        className="w-full h-2 bg-slate-800 hover:h-3 rounded-full cursor-pointer relative group transition-all duration-150"
        onClick={handleTimelineClick}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full relative transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: Play/Pause/Rewind */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isPlaying ? onPause() : onPlay())}
            disabled={!canControl}
            className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            disabled={!canControl}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs font-mono text-slate-300 select-none">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-500">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Center: Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {syncStatus === 'synchronized' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In Sync
            </span>
          )}
          {syncStatus === 'syncing' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing...
            </span>
          )}
          {syncStatus === 'drift-correcting' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Aligning
            </span>
          )}
        </div>

        {/* Right: Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

