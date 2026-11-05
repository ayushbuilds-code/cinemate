import React, { useState } from 'react';
import { Film, Copy, Check, LogOut, Users, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
  isHost: boolean;
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  participantCount,
  isHost,
  onLeaveRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="bg-[#09090F]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Room ID */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-600/30">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm hidden sm:inline tracking-tight">
              Cine<span className="text-purple-400">Mate</span>
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-[#181824] border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500">Room</span>
            <span className="text-xs font-mono font-bold text-purple-300 tracking-wider">{roomId}</span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isHost && (
            <span className="hidden md:inline-block text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Host Controls
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Invite Friend Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          {/* Participant count indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-[#181824] border border-slate-800 px-3 py-1.5 rounded-xl">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{participantCount}/2</span>
          </div>

          {/* Leave Room Button */}
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
            title="Leave watch party"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </header>
  );
};

