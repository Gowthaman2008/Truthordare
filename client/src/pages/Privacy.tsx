import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';
import { sound } from '../services/sound';

interface PrivacyProps {
  onNavigate: (route: string) => void;
}

export const Privacy: React.FC<PrivacyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 max-w-3xl mx-auto">
      <button
        onClick={() => { sound.playClick(); onNavigate('/'); }}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-pink/20 flex items-center justify-center text-neon-pink">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Privacy Policy
            </h2>
            <p className="text-xs text-slate-400">Last updated: 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Your privacy and security are fundamental to <strong>TRUTH & DARE</strong>. This policy explains our privacy principles:
          </p>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-neon-cyan" />
              <span>1. Zero Personal Data Tracking</span>
            </h4>
            <p className="text-xs text-slate-400">
              We do not require accounts, email addresses, passwords, or phone numbers. All multiplayer rooms are ephemeral and private.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-neon-purple" />
              <span>2. Authoritative Ephemeral Rooms</span>
            </h4>
            <p className="text-xs text-slate-400">
              Game session data (such as player names, scores, and custom prompts) is maintained in memory strictly for the duration of the match and deleted after room expiration.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-neon-pink" />
              <span>3. Local Storage Preferences</span>
            </h4>
            <p className="text-xs text-slate-400">
              Your chosen nickname, avatar, and audio preference (muted/unmuted) are saved locally on your own device in standard browser localStorage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
