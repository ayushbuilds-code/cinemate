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
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#181824] border border-slate-800 shadow-lg group">
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
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#181824] to-[#11111B] gap-2.5 p-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center text-purple-200 font-extrabold text-xl shadow-lg shadow-purple-900/20">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-400">Camera Off</span>
        </div>
      )}

      {/* Badges Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-xs font-semibold text-white shadow-md">
          <span>{displayName}</span>
          {isLocal && <span className="text-purple-300 text-[11px] font-normal">(You)</span>}
          {role === 'host' && (
            <span className="bg-purple-500/40 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
              Host
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isMicOn && (
            <div className="w-7 h-7 rounded-lg bg-rose-500/90 backdrop-blur-md flex items-center justify-center text-white shadow-md" title="Muted">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
          {!isCameraOn && (
            <div className="w-7 h-7 rounded-lg bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-300 border border-slate-700 shadow-md" title="Camera disabled">
              <CameraOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

