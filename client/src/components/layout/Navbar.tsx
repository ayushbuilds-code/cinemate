import React from 'react';
import { Film, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090F]/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Cine<span className="text-purple-400">Mate</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="/#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a>
          <a href="/#features" className="hover:text-purple-400 transition-colors">Features</a>
          <a href="/#compatibility" className="hover:text-purple-400 transition-colors">Supported Media</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/join"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-[#181824] border border-slate-800 hover:border-slate-700 transition-all duration-200"
          >
            Join Room
          </Link>
          <Link
            to="/create"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all duration-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Room</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

