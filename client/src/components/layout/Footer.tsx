import React from 'react';
import { Heart, ShieldCheck, Video, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#09090F] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">CineMate</span>
          <span className="text-slate-600">—</span>
          <span>Watch Together, Anywhere.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            Socket.IO Synchronized
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            Peer-to-Peer WebRTC
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            No DRM Circumvention / Privacy First
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>for shared moments</span>
        </div>
      </div>
    </footer>
  );
};

