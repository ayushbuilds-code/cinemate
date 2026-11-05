import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, ArrowRight, User, KeyRound } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useSocket } from '../hooks/useSocket';

export const JoinRoomPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get('code') || '';

  const [roomId, setRoomId] = useState(initialRoom);
  const [displayName, setDisplayName] = useState(
    localStorage.getItem('cinemate_display_name') || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { socket, participantId } = useSocket();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !displayName.trim()) {
      setError('Please provide both room code and your name');
      return;
    }

    if (!socket) {
      setError('Connecting to server, please wait...');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cleanRoomCode = roomId.toUpperCase().trim();
    localStorage.setItem('cinemate_display_name', displayName.trim());

    socket.emit(
      'room:join',
      {
        roomId: cleanRoomCode,
        displayName: displayName.trim(),
        participantId,
      },
      (res: { success: boolean; room?: any; error?: string }) => {
        setIsSubmitting(false);
        if (res.success && res.room) {
          navigate(`/room/${res.room.roomId}`);
        } else {
          setError(res.error || 'Failed to join room. Verify code or room status.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#09090F] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#181824] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Join Watch Room</h2>
            <p className="text-xs text-slate-400">
              Enter the room code provided by your friend to jump in.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Room Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g. 4MN8TS"
                  maxLength={10}
                  required
                  className="w-full bg-[#11111B] border border-slate-800 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl text-sm font-mono tracking-wider text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Your Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Emma"
                  maxLength={30}
                  required
                  className="w-full bg-[#11111B] border border-slate-800 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !roomId.trim() || !displayName.trim()}
              className="w-full py-3.5 mt-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Connecting...' : 'Join Party'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

