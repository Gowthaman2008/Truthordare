import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

interface ScoreToast {
  id: string;
  points: number;
  reason: string;
  streak: number;
}

export const ScoreGainToast: React.FC = () => {
  const [toasts, setToasts] = useState<ScoreToast[]>([]);

  useEffect(() => {
    const handleScoreGained = (data: { playerId: string; points: number; streak: number; reason: string }) => {
      if (data.streak >= 3) {
        sound.playStreakBonus();
      } else {
        sound.playComplete();
      }

      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, points: data.points, reason: data.reason, streak: data.streak }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    socket.on('scoreGained', handleScoreGained);

    return () => {
      socket.off('scoreGained', handleScoreGained);
    };
  }, []);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-bounce-in flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan p-[1px] shadow-2xl shadow-neon-pink/40"
        >
          <div className="bg-[#0e1124] px-4 py-2 rounded-2xl flex items-center gap-3">
            <span className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-amber-300">
              +{toast.points} PTS
            </span>
            {toast.streak > 1 && (
              <span className="text-xs font-black uppercase tracking-wider bg-neon-pink/20 text-neon-pink px-2.5 py-1 rounded-full border border-neon-pink/40 flex items-center gap-1">
                🔥 {toast.streak} STREAK
              </span>
            )}
            <span className="text-xs text-slate-300 font-semibold">{toast.reason}</span>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes bounceIn {
          0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
          40% { transform: translateY(5px) scale(1.08); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};
