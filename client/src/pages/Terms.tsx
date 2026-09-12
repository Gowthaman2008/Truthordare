import React from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { sound } from '../services/sound';

interface TermsProps {
  onNavigate: (route: string) => void;
}

export const Terms: React.FC<TermsProps> = ({ onNavigate }) => {
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
          <div className="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Terms of Service
            </h2>
            <p className="text-xs text-slate-400">Rules & Safe Play Guidelines</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            By using <strong>TRUTH & DARE</strong>, you agree to maintain a safe, respectful, and friendly gaming environment.
          </p>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1. Safe & Consensual Play</span>
            </h4>
            <p className="text-xs text-slate-400">
              Never attempt dangerous, harmful, illegal, or harassing activities. Players always have the right to pass or skip any question.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
              <span>2. Respect in Custom Prompts</span>
            </h4>
            <p className="text-xs text-slate-400">
              When authoring custom truths or dares, ensure they remain appropriate and fun for your friend.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neon-pink" />
              <span>3. Entertainment Purposes</span>
            </h4>
            <p className="text-xs text-slate-400">
              All gameplay is intended strictly for social entertainment among consenting friends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
