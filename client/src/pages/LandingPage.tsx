import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play, Sparkles, Video, MessageSquare, ShieldCheck, Heart, Zap, Copy } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090F] flex flex-col selection:bg-purple-500/30">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 to-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-[#181824] border border-purple-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-purple-300 shadow-lg shadow-purple-900/10 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Watch Together, Anywhere.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
              Distance Doesn't Matter When You're{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
                Watching Together.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
              Create your private 2-person movie room, invite your favorite person, and enjoy synchronized movies with crystal-clear video calling and live reactions — from anywhere in the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/create"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 border border-purple-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
              >
                <Sparkles className="w-5 h-5" />
                <span>Create a Room</span>
              </Link>

              <Link
                to="/join"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#181824] hover:bg-[#202030] text-slate-200 font-semibold text-base border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Join a Room</span>
              </Link>
            </div>
          </div>

          {/* Interactive Mockup Graphic */}
          <div className="max-w-5xl mx-auto mt-16 rounded-2xl p-2 bg-gradient-to-b from-slate-800/80 to-slate-900/40 border border-slate-800 shadow-2xl relative">
            <div className="rounded-xl overflow-hidden bg-[#11111B] border border-slate-800/80 aspect-[16/9] relative flex flex-col">
              {/* Fake Mockup Header */}
              <div className="h-10 border-b border-slate-800 bg-[#181824] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded-md border border-slate-800">
                  cinemate.app/room/LOVE2026
                </div>
                <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 2 Online
                </div>
              </div>

              {/* 70/30 Preview Layout */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-10 gap-2 p-3 bg-[#09090F]">
                {/* 70% Player Preview */}
                <div className="md:col-span-7 bg-[#11111B] rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-2">
                    <Play className="w-7 h-7 fill-purple-400 ml-1" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Synchronized Playback Engine</span>
                  <span className="text-[10px] text-slate-500">Sub-second drift alignment</span>

                  <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                      <div className="h-1.5 w-32 sm:w-60 bg-slate-700 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-purple-500 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">● In Sync</span>
                  </div>
                </div>

                {/* 30% Video Call & Chat Preview */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 h-28">
                    <div className="bg-[#181824] rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center p-2">
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-xs font-bold mb-1">
                        A
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium">Alex (You)</span>
                    </div>
                    <div className="bg-[#181824] rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center p-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold mb-1">
                        E
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium">Emma ❤️</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-[#181824] rounded-xl border border-slate-800 p-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="bg-purple-600/20 text-purple-200 text-[10px] p-1.5 rounded-lg border border-purple-500/20">
                        "Wait did you see that twist?! 😱"
                      </div>
                      <div className="bg-slate-800 text-slate-300 text-[10px] p-1.5 rounded-lg border border-slate-700">
                        "Haha yes! Don't pause it yet!"
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2">
                      <span>Type a message...</span>
                      <span>🍿 ❤️ 🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-[#11111B]/40 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How CineMate Works</h2>
              <p className="text-sm text-slate-400">Three effortless steps to your shared movie night.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#181824] border border-slate-800 rounded-2xl p-6 relative group hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 font-mono text-xl font-bold flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-white mb-2">Create a Private Room</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start your ephemeral room with one click. No mandatory sign-ups, passwords, or bloat.
                </p>
              </div>

              <div className="bg-[#181824] border border-slate-800 rounded-2xl p-6 relative group hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 font-mono text-xl font-bold flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-white mb-2">Invite Your Watch Buddy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Share the generated invite link. Your friend joins instantly right from their browser on Mac, PC, or mobile.
                </p>
              </div>

              <div className="bg-[#181824] border border-slate-800 rounded-2xl p-6 relative group hover:border-purple-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 font-mono text-xl font-bold flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-white mb-2">Watch & Call Synchronously</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste YouTube or video links. When one pauses or seeks, both sync up instantly while talking face-to-face.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Highlights */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Designed for Meaningful Connection</h2>
              <p className="text-sm text-slate-400">Everything needed to feel together when miles apart.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-[#181824] rounded-2xl border border-slate-800">
                <Zap className="w-6 h-6 text-purple-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1.5">Sub-Second Sync</h4>
                <p className="text-xs text-slate-400">Real-time play, pause, seek, and drift recovery powered by Socket.IO.</p>
              </div>

              <div className="p-6 bg-[#181824] rounded-2xl border border-slate-800">
                <Video className="w-6 h-6 text-indigo-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1.5">Peer-to-Peer WebRTC</h4>
                <p className="text-xs text-slate-400">Direct encrypted video & audio streams with mic mute and camera toggle.</p>
              </div>

              <div className="p-6 bg-[#181824] rounded-2xl border border-slate-800">
                <MessageSquare className="w-6 h-6 text-pink-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1.5">Live Chat & Reactions</h4>
                <p className="text-xs text-slate-400">Express instant feelings with interactive emojis, typing indicators, and alerts.</p>
              </div>

              <div className="p-6 bg-[#181824] rounded-2xl border border-slate-800">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1.5">Private & Secure</h4>
                <p className="text-xs text-slate-400">Ephemeral room memory, no recordings, no DRM bypass, strict sanitization.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

