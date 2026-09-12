import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Sparkles, Share2, RotateCcw, Home, 
  Check, Award
} from 'lucide-react';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import type { RoomState } from '../types';

interface ResultsProps {
  roomState: RoomState;
  currentSocketId: string;
  onNavigate: (route: string) => void;
}

export const Results: React.FC<ResultsProps> = ({ roomState, onNavigate }) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const p1 = roomState.players[0];
  const p2 = roomState.players[1] || roomState.players[0];
  const winnerInfo = roomState.winner;

  const winnerPlayer = p1.score > p2.score ? p1 : (p2.score > p1.score ? p2 : null);
  const isTie = winnerInfo?.isTie || p1.score === p2.score;

  // Trigger celebration confetti and fanfare on render
  useEffect(() => {
    sound.playWinnerFanfare();

    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handlePlayAgain = () => {
    sound.playClick();
    socketService.playAgain();
  };

  const handleShare = async () => {
    sound.playClick();
    const highestStreak = Math.max(p1.highestStreak, p2.highestStreak);
    const totalChallenges = (p1.truthsCompleted + p1.daresCompleted) + (p2.truthsCompleted + p2.daresCompleted);
    
    const text = `🎉 TRUTH & DARE MATCH RESULT!
${p1.name} (${p1.score} pts) vs ${p2.name} (${p2.score} pts)
🏆 Winner: ${isTie ? 'Tie Game!' : winnerPlayer?.name}
🔥 Highest Streak: ${highestStreak}
🎯 Challenges Completed: ${totalChallenges}
Play online: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Truth & Dare Game Results',
          text: text,
          url: window.location.origin,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 max-w-4xl mx-auto flex flex-col items-center">
      
      {/* Top Victory Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-pink/20 border border-neon-pink/40 text-neon-pink text-xs font-black uppercase tracking-widest mb-3 shadow-glow-pink animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>GAME COMPLETE</span>
        </div>

        <h2 className="font-display font-black text-4xl sm:text-6xl text-white mb-2">
          {isTie ? "IT'S A TIE!" : `${winnerPlayer?.name} WINS!`}
        </h2>
        <p className="text-sm text-slate-400">
          Completed {roomState.settings.maxRounds} rounds of truths and dares!
        </p>
      </div>

      {/* Podium Winner Showcase */}
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl mb-8 text-center relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Trophy & Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-neon-pink to-neon-purple flex items-center justify-center text-6xl shadow-glow-amber select-none">
              {isTie ? '🤝' : (winnerPlayer?.avatar || '🏆')}
            </div>
            {!isTie && (
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shadow-lg">
                <Trophy className="w-5 h-5 fill-black" />
              </div>
            )}
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">
            {isTie ? 'CO-CHAMPIONS' : 'THE CHAMPION'}
          </span>
          <h3 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">
            {isTie ? `${p1.name} & ${p2.name}` : winnerPlayer?.name}
          </h3>

          {/* Scores Pill Comparison */}
          <div className="grid grid-cols-2 gap-4 w-full p-4 rounded-2xl glass-panel border border-white/10">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">{p1.name}</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-neon-purple">
                {p1.score} <span className="text-xs text-slate-400 font-semibold">PTS</span>
              </div>
            </div>

            <div className="text-center border-l border-white/10">
              <span className="text-xs font-bold text-slate-400 uppercase">{p2.name}</span>
              <div className="font-display font-black text-2xl sm:text-3xl text-neon-cyan">
                {p2.score} <span className="text-xs text-slate-400 font-semibold">PTS</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Detailed Statistics Table */}
      <div className="w-full max-w-xl glass-card rounded-2xl p-6 border border-white/10 mb-8">
        <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-neon-pink" />
          <span>Match Breakdown</span>
        </h4>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-slate-400">Truths Completed</span>
            <div className="flex gap-4 font-bold">
              <span className="text-neon-purple">{p1.name}: {p1.truthsCompleted}</span>
              <span className="text-neon-cyan">{p2.name}: {p2.truthsCompleted}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-slate-400">Dares Completed</span>
            <div className="flex gap-4 font-bold">
              <span className="text-neon-purple">{p1.name}: {p1.daresCompleted}</span>
              <span className="text-neon-cyan">{p2.name}: {p2.daresCompleted}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-slate-400">Highest Streak</span>
            <div className="flex gap-4 font-bold">
              <span className="text-neon-purple">{p1.name}: 🔥 {p1.highestStreak}</span>
              <span className="text-neon-cyan">{p2.name}: 🔥 {p2.highestStreak}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">Questions Skipped</span>
            <div className="flex gap-4 font-bold">
              <span className="text-slate-300">{p1.name}: {p1.skipsUsed}</span>
              <span className="text-slate-300">{p2.name}: {p2.skipsUsed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl">
        <button
          onClick={handlePlayAgain}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:opacity-95 text-white font-display font-black text-base tracking-wider shadow-glow-purple flex items-center justify-center gap-2 btn-3d"
        >
          <RotateCcw className="w-5 h-5" />
          <span>PLAY AGAIN (REMATCH)</span>
        </button>

        <button
          onClick={handleShare}
          className="w-full sm:w-auto py-4 px-6 rounded-2xl glass-card hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 font-bold text-sm flex items-center justify-center gap-2 btn-3d"
        >
          {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-neon-pink" />}
          <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Results'}</span>
        </button>

        <button
          onClick={() => { sound.playClick(); onNavigate('/'); }}
          className="w-full sm:w-auto py-4 px-6 rounded-2xl glass-card hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 font-bold text-sm flex items-center justify-center gap-2 btn-3d"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      </div>

    </div>
  );
};
