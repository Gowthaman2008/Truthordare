import React from 'react';
import { Flame, ShieldCheck, FileText, Heart } from 'lucide-react';
import { sound } from '../services/sound';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-white/5 bg-[#070912]/80 backdrop-blur-md py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-neon-purple to-neon-pink flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm text-slate-200 tracking-wide">
              TRUTH & DARE
            </span>
            <p className="text-xs text-slate-500">
              Two friends. One room. Endless fun.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap justify-center gap-6 text-xs text-slate-400 font-medium">
          <button 
            onClick={() => { sound.playClick(); onNavigate('/how-to-play'); }}
            className="hover:text-neon-cyan transition-colors"
          >
            How to Play
          </button>
          <button 
            onClick={() => { sound.playClick(); onNavigate('/privacy'); }}
            className="hover:text-neon-pink transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy
          </button>
          <button 
            onClick={() => { sound.playClick(); onNavigate('/terms'); }}
            className="hover:text-neon-purple transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Built for friends everywhere</span>
          <Heart className="w-3.5 h-3.5 text-neon-pink fill-neon-pink inline" />
        </div>

      </div>
    </footer>
  );
};
