import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, User } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isLocal?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  role?: 'host' | 'guest';
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  displayName,
  isLocal = false,
  isCameraOn = true,
  isMicOn = true,
  role,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Name and Badges Header — Displayed ABOVE the video box as requested */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-200 tracking-wide">{displayName}</span>
          {isLocal && <span className="text-[11px] text-purple-400 font-semibold">(You)</span>}
          {role === 'host' && (
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
              Host
            </span>
          )}
        </div>

        {/* Media indicator icons */}
        <div className="flex items-center gap-1">
          {!isMicOn && (
            <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              <MicOff className="w-3 h-3" />
              Muted
            </span>
          )}
          {!isCameraOn && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-medium bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
              <CameraOff className="w-3 h-3" />
              Off
            </span>
          )}
        </div>
      </div>

      {/* Video Box Container - Larger dimensions */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#181824] border border-slate-800 shadow-xl group">
        {/* Video Track element */}
        {isCameraOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Always mute local video to prevent echo
            className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          /* Avatar Placeholder when camera is off */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181824] to-[#11111B] gap-3 p-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center text-purple-200 font-black text-2xl shadow-xl shadow-purple-900/25">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-400">Camera Off</span>
          </div>
        )}
      </div>
    </div>
  );
};
