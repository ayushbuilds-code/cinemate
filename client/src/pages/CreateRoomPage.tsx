import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Film, ArrowRight, User } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useSocket } from '../hooks/useSocket';

export const CreateRoomPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { socket, participantId } = useSocket();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError('Connecting to CineMate server, please wait...');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Save name locally for convenience
    localStorage.setItem('cinemate_display_name', displayName.trim());

    socket.emit(
      'room:create',
      {
        displayName: displayName.trim(),
        participantId,
      },
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsSubmitting(false);
        if (response.success && response.room) {
          navigate(`/room/${response.room.roomId}`);
        } else {
          setError(response.error || 'Failed to create room. Please try again.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#09090F] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#181824] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 mx-auto flex items-center justify-center mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create Your Room</h2>
            <p className="text-xs text-slate-400">
              Host a private session for two and share your favorite movies.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
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
                  placeholder="e.g. Alex"
                  maxLength={30}
                  required
                  autoFocus
                  className="w-full bg-[#11111B] border border-slate-800 focus:border-purple-500 pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Room...' : 'Start Watch Party'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

