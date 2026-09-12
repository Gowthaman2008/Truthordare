import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

interface FloatingEmoji {
  id: string;
  emoji: string;
  senderName: string;
  left: number;
}

export const ReactionOverlay: React.FC = () => {
  const [reactions, setReactions] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    const handleReaction = (data: { emoji: string; senderName: string; senderId: string }) => {
      sound.playReaction();
      const id = `${Date.now()}_${Math.random()}`;
      const left = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal

      setReactions((prev) => [...prev, { id, emoji: data.emoji, senderName: data.senderName, left }]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    };

    socket.on('reactionReceived', handleReaction);

    return () => {
      socket.off('reactionReceived', handleReaction);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          style={{ left: `${r.left}%` }}
          className="absolute bottom-20 flex flex-col items-center animate-reaction-float transition-all"
        >
          <div className="text-4xl sm:text-5xl filter drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] select-none">
            {r.emoji}
          </div>
          <span className="text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-full text-white/90 border border-white/10 mt-1 whitespace-nowrap">
            {r.senderName}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes reactionFloat {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            transform: translateY(-40px) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translateY(-240px) scale(1);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-320px) scale(0.8);
            opacity: 0;
          }
        }
        .animate-reaction-float {
          animation: reactionFloat 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

interface ReactionToolbarProps {
  onSendReaction: (emoji: string) => void;
}

export const ReactionToolbar: React.FC<ReactionToolbarProps> = ({ onSendReaction }) => {
  const emojis = ['🔥', '😂', '😱', '👏', '🏆', '💀', '🍿'];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl glass-card border border-white/15 shadow-xl">
      <span className="text-[11px] font-bold text-slate-400 uppercase px-2 hidden md:inline">
        Cheer
      </span>
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            sound.playClick();
            onSendReaction(emoji);
          }}
          className="text-xl sm:text-2xl p-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-125 transition-all focus:outline-none hover:shadow-glow-purple"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
