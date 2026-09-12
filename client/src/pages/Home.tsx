import React from 'react';
import { Sparkles, Users, Play } from 'lucide-react';
import { sound } from '../services/sound';

interface HomeProps {
  onNavigate: (route: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-8 lg:py-16 overflow-hidden">
      
      {/* Floating 3D Decorative Cards in Background */}
      <div className="absolute left-6 lg:left-20 top-24 hidden md:block animate-float pointer-events-none z-0">
        <div className="w-48 h-64 rounded-3xl p-5 glass-card border-neon-purple/40 shadow-glow-purple -rotate-12 transform hover:rotate-0 transition-transform">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💬</span>
            <span className="text-xs font-black tracking-widest text-neon-purple uppercase">TRUTH</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            "What is the most ridiculous excuse you've ever used to get out of plans?"
          </p>
          <div className="mt-8 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>+10 PTS</span>
            <span>FUNNY</span>
          </div>
        </div>
      </div>

      <div className="absolute right-6 lg:right-20 top-32 hidden md:block animate-float-reverse pointer-events-none z-0">
        <div className="w-48 h-64 rounded-3xl p-5 glass-card border-neon-cyan/40 shadow-glow-cyan rotate-12 transform hover:rotate-0 transition-transform">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-black tracking-widest text-neon-cyan uppercase">DARE</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            "Do your best impression of an overly dramatic movie trailer voice for 20 seconds!"
          </p>
          <div className="mt-8 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>+15 PTS</span>
            <span>ACTING</span>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        
        {/* Neon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-white/10 mb-6 shadow-glow-purple">
          <Sparkles className="w-4 h-4 text-neon-pink animate-spin" />
          <span className="text-xs font-bold tracking-wider text-slate-200">
            THE ULTIMATE 2-PLAYER PARTY GAME
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white mb-4">
          TRUTH <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">&</span> DARE
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-2xl text-slate-300 font-medium max-w-2xl mb-8 leading-relaxed">
          Play Truth or Dare online with your friend in real time.
          <span className="block text-slate-400 text-sm sm:text-base mt-2">
            1,000+ curated questions • Live countdown timers • Streak bonuses • Private rooms
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center mb-16">
          <button
            onClick={() => { sound.playClick(); onNavigate('/create'); }}
            className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:opacity-95 text-white font-display font-black text-lg tracking-wider shadow-glow-purple hover:scale-[1.03] transition-all flex items-center justify-center gap-3 btn-3d"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>CREATE GAME</span>
          </button>

          <button
            onClick={() => { sound.playClick(); onNavigate('/join'); }}
            className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl glass-card border border-white/20 hover:border-white/40 text-slate-100 hover:text-white font-display font-bold text-lg tracking-wider hover:scale-[1.03] transition-all flex items-center justify-center gap-2 btn-3d"
          >
            <Users className="w-5 h-5 text-neon-cyan" />
            <span>JOIN GAME</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
          
          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-neon-purple/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center mb-2 text-xl">
              🎮
            </div>
            <span className="text-xs font-bold text-white mb-0.5">2 Player Online</span>
            <span className="text-[11px] text-slate-400">P2P Real-time</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-neon-pink/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-neon-pink/20 flex items-center justify-center mb-2 text-xl">
              ⚡
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Live Sync</span>
            <span className="text-[11px] text-slate-400">Zero Latency</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-neon-amber/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-neon-amber/20 flex items-center justify-center mb-2 text-xl">
              🔥
            </div>
            <span className="text-xs font-bold text-white mb-0.5">1000+ Questions</span>
            <span className="text-[11px] text-slate-400">Safe & Hilarious</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-neon-cyan/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center mb-2 text-xl">
              🎲
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Random Engine</span>
            <span className="text-[11px] text-slate-400">No Duplicates</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-neon-blue/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center mb-2 text-xl">
              🎨
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Game Modes</span>
            <span className="text-[11px] text-slate-400">8 Fun Styles</span>
          </div>

          <div className="p-4 rounded-2xl glass-card border-white/5 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2 text-xl">
              🔒
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Private Rooms</span>
            <span className="text-[11px] text-slate-400">6-Digit Code & QR</span>
          </div>

        </div>

      </div>
    </div>
  );
};
