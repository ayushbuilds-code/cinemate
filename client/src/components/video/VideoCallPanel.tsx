import React from 'react';
import { Video, PhoneOff, VideoOff, Mic, MicOff, Users, AlertCircle, Sparkles } from 'lucide-react';
import { VideoTile } from './VideoTile';
import { CallStatus } from '../../hooks/useWebRTC';
import { Participant } from '../../types';

interface VideoCallPanelProps {
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  remoteCameraOn: boolean;
  remoteMicOn: boolean;
  errorMessage: string | null;
  currentParticipant: Participant | null;
  remoteParticipant: Participant | null;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export const VideoCallPanel: React.FC<VideoCallPanelProps> = ({
  callStatus,
  localStream,
  remoteStream,
  isCameraOn,
  isMicOn,
  remoteCameraOn,
  remoteMicOn,
  errorMessage,
  currentParticipant,
  remoteParticipant,
  onStartCall,
  onEndCall,
  onToggleCamera,
  onToggleMic,
}) => {
  const isInCall = callStatus !== 'idle' && callStatus !== 'permission-denied';

  return (
    <div className="bg-[#181824] border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Video Call</h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>{remoteParticipant ? '2 in Room' : 'Waiting for friend'}</span>
        </div>
      </div>

      {/* Permission error prompt */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Video Tiles Grid */}
      {!isInCall ? (
        <div className="bg-[#11111B] rounded-2xl p-7 text-center border border-slate-800 flex flex-col items-center justify-center gap-3.5 min-h-[220px]">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-inner">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Face-to-Face Calling</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Watch together while seeing your friend's live reactions with real-time peer-to-peer WebRTC.
            </p>
          </div>
          <button
            onClick={onStartCall}
            className="mt-1 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/25 border border-purple-500/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Join Video Call</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Tiles - larger responsive display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <VideoTile
              stream={localStream}
              displayName={currentParticipant?.displayName || 'You'}
              isLocal={true}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              role={currentParticipant?.role}
            />

            {remoteParticipant ? (
              <VideoTile
                stream={remoteStream}
                displayName={remoteParticipant.displayName}
                isLocal={false}
                isCameraOn={remoteCameraOn}
                isMicOn={remoteMicOn}
                role={remoteParticipant.role}
              />
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl bg-[#11111B] border border-slate-800 flex flex-col items-center justify-center text-center p-4 gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <Users className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Waiting for friend...</span>
                <span className="text-[11px] text-slate-500">Send them the invite link above</span>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-3 bg-[#11111B] p-2.5 rounded-xl border border-slate-800/80">
            <button
              onClick={onToggleMic}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleCamera}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isCameraOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
              title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={onEndCall}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md shadow-rose-600/20"
              title="Leave Video Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

