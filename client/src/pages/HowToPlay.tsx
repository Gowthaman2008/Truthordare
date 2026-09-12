import React from 'react';
import { ArrowLeft, Play, Trophy, Sparkles } from 'lucide-react';
import { sound } from '../services/sound';

interface HowToPlayProps {
  onNavigate: (route: string) => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 max-w-4xl mx-auto">
      
      {/* Back Button */}
      <button
        onClick={() => { sound.playClick(); onNavigate('/'); }}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="text-center mb-10">
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white mb-2">
          How to Play TRUTH & DARE
        </h2>
        <p className="text-sm sm:text-base text-slate-400">
          Everything you need to know to play with your best friend remotely!
        </p>
      </div>

      {/* Steps Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        <div className="p-6 rounded-3xl glass-card border-white/10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-neon-purple/20 text-neon-purple flex items-center justify-center font-display font-black text-xl mb-4 border border-neon-purple/30 shadow-glow-purple">
            1
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            Create a Room
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Click Create Game, customize your timer, rounds, and preferred categories, then copy your unique 6-character room code or QR code.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card border-white/10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-neon-pink/20 text-neon-pink flex items-center justify-center font-display font-black text-xl mb-4 border border-neon-pink/30 shadow-glow-pink">
            2
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            Friend Joins
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your friend enters the 6-character code or opens your invite link. Both of you enter the live lobby with instant audio/visual sync.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card border-white/10 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-neon-cyan/20 text-neon-cyan flex items-center justify-center font-display font-black text-xl mb-4 border border-neon-cyan/30 shadow-glow-cyan">
            3
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            Take Turns & Score
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pick Truth or Dare on your turn, complete the challenge before the timer expires, build massive streaks, and claim the championship!
          </p>
        </div>

      </div>

      {/* Rules and Scoring Details */}
      <div className="space-y-6">
        
        {/* Scoring Breakdown */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card border-white/10">
          <h3 className="font-display font-black text-xl text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Scoring & Streak Multipliers</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl glass-panel border border-neon-purple/30">
              <span className="font-black text-neon-purple text-base block mb-1">💬 TRUTH</span>
              <span className="font-bold text-white text-lg block mb-1">+10 Points</span>
              <span className="text-slate-400">Answer truthfully without skipping.</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-neon-cyan/30">
              <span className="font-black text-neon-cyan text-base block mb-1">🔥 DARE</span>
              <span className="font-bold text-white text-lg block mb-1">+15 Points</span>
              <span className="text-slate-400">Perform the action challenge on camera or call.</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-neon-pink/30">
              <span className="font-black text-neon-pink text-base block mb-1">⚡ STREAK BONUS</span>
              <span className="font-bold text-white text-lg block mb-1">+10 to +50 Pts</span>
              <span className="text-slate-400">Complete 3, 5, or 10 challenges in a row!</span>
            </div>
          </div>
        </div>

        {/* Remote Party Tips */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card border-white/10">
          <h3 className="font-display font-black text-xl text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <span>Pro Tips for Remote Friends</span>
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-neon-cyan font-bold">•</span>
              <span><strong>Use Video or Voice Call:</strong> Open Discord, FaceTime, WhatsApp, or Zoom alongside the website for maximum fun!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-pink font-bold">•</span>
              <span><strong>Add Custom Inside Jokes:</strong> In the lobby, click "+ Add Custom Prompt" to surprise your friend with inside jokes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-purple font-bold">•</span>
              <span><strong>Cheer in Real Time:</strong> Use the live reaction bar at the bottom to send 🔥, 😂, and 👏 across both screens instantly.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <button
          onClick={() => { sound.playClick(); onNavigate('/create'); }}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:opacity-95 text-white font-display font-black text-lg tracking-wider shadow-glow-purple btn-3d inline-flex items-center gap-2"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>START PLAYING NOW</span>
        </button>
      </div>

    </div>
  );
};
