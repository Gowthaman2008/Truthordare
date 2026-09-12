import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, LogIn, Hash } from 'lucide-react';
import { AvatarPicker } from '../components/AvatarPicker';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import type { RoomState } from '../types';

interface JoinRoomProps {
  initialCode?: string;
  onNavigate: (route: string) => void;
  onRoomJoined: (code: string, state?: RoomState) => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ initialCode = '', onNavigate, onRoomJoined }) => {
  const [code, setCode] = useState<string>(initialCode.toUpperCase());
  const [name, setName] = useState<string>(localStorage.getItem('td_player_name') || '');
  const [avatar, setAvatar] = useState<string>(localStorage.getItem('td_player_avatar') || '🦊');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your player name');
      return;
    }

    setError(null);
    setLoading(true);
    sound.playClick();

    localStorage.setItem('td_player_name', name.trim());
    localStorage.setItem('td_player_avatar', avatar);

    try {
      const res = await socketService.joinRoom(cleanCode, name, avatar);
      if (res.success) {
        sound.playComplete();
        onRoomJoined(cleanCode, res.state);
      } else {
        setError(res.error || 'Failed to join game room.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative">
        <button
          onClick={() => { sound.playClick(); onNavigate('/'); }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-cyan to-neon-blue flex items-center justify-center shadow-glow-cyan">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Join Game Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your friend's 6-character invite code
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neon-cyan" />
              <span>Enter Room Code</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. A7K92P"
                maxLength={6}
                required
                className="w-full px-4 py-4 rounded-2xl glass-panel border border-neon-cyan/40 text-center font-display font-black text-2xl sm:text-3xl tracking-[0.3em] text-neon-cyan uppercase placeholder-slate-600 focus:outline-none focus:border-neon-cyan focus:ring-4 focus:ring-neon-cyan/20 shadow-glow-cyan transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              maxLength={20}
              required
              className="w-full px-4 py-3.5 rounded-2xl glass-panel border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 text-base font-semibold transition-all"
            />
          </div>

          <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-blue hover:opacity-95 text-white font-display font-black text-lg tracking-wider shadow-glow-cyan hover:scale-[1.01] transition-all flex items-center justify-center gap-2 btn-3d disabled:opacity-50"
          >
            {loading ? (
              <span>CONNECTING...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>JOIN GAME</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
