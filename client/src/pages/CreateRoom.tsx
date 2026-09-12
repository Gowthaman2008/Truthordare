import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Check, Clock, RotateCcw, Layers } from 'lucide-react';
import { AvatarPicker } from '../components/AvatarPicker';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import type { GameMode, Difficulty, TimerOption, SkipsOption, RoomState } from '../types';

interface CreateRoomProps {
  onNavigate: (route: string) => void;
  onRoomCreated: (code: string, state?: RoomState) => void;
}

const ALL_CATEGORIES = [
  'Flirty & Crush', 'Romantic & Cute', 'Funny & Teasing', 'Secrets & Confessions',
  'First Impressions', 'Would You Rather', 'Deep Feelings', 'Friendship Vibes',
  'Flirty & Sweet', 'Camera & Cute Poses', 'Voice & Singing', 'Playful & Teasing',
  'Eye Contact & Smiles', 'Acting & Romantic', 'Compliments', 'Quick Challenges'
];

export const CreateRoom: React.FC<CreateRoomProps> = ({ onNavigate, onRoomCreated }) => {
  const [name, setName] = useState<string>(localStorage.getItem('td_player_name') || '');
  const [avatar, setAvatar] = useState<string>(localStorage.getItem('td_player_avatar') || '😎');
  const [mode, setMode] = useState<GameMode>('Classic');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [timerDuration, setTimerDuration] = useState<TimerOption>(30);
  const [maxSkips, setMaxSkips] = useState<SkipsOption>(3);
  const [maxRounds, setMaxRounds] = useState<number>(10);
  const [categories, setCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const gameModes: { mode: GameMode; desc: string; icon: string }[] = [
    { mode: 'Classic', desc: 'Balanced mix of Truths and Dares', icon: '✨' },
    { mode: 'Random', desc: 'Surprise wild mix with chaos', icon: '🎲' },
    { mode: 'Truth Only', desc: '100% deep, funny and honest confessions', icon: '💬' },
    { mode: 'Dare Only', desc: '100% hilarious action challenges', icon: '🔥' },
    { mode: 'Funny Friends', desc: 'Non-stop comedy, pranks and laugh-offs', icon: '😂' },
    { mode: 'Best Friends', desc: 'Memories, secrets, inside jokes & vibes', icon: '🤝' },
    { mode: 'Getting to Know You', desc: 'Great for new friends & breaking the ice', icon: '🌱' },
    { mode: 'Challenge Mode', desc: 'Hardcore high-energy dares & fast tests', icon: '⚡' },
  ];

  const timerOptions: { label: string; value: TimerOption }[] = [
    { label: 'No Timer', value: 0 },
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '2 Min', value: 120 },
  ];

  const skipOptions: { label: string; value: SkipsOption }[] = [
    { label: 'No Limit', value: -1 },
    { label: '3 Skips', value: 3 },
    { label: '5 Skips', value: 5 },
    { label: '10 Skips', value: 10 },
  ];

  const difficulties: (Difficulty | 'All')[] = ['All', 'Easy', 'Normal', 'Funny', 'Challenge'];

  const toggleCategory = (cat: string) => {
    sound.playClick();
    if (categories.includes(cat)) {
      if (categories.length === 1) return;
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const selectAllCategories = () => {
    sound.playClick();
    setCategories([...ALL_CATEGORIES]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setError(null);
    setLoading(true);
    sound.playClick();

    localStorage.setItem('td_player_name', name.trim());
    localStorage.setItem('td_player_avatar', avatar);

    try {
      const res = await socketService.createRoom(name, avatar, {
        mode,
        difficulty,
        timerDuration,
        maxSkips,
        maxRounds,
        categories,
      });

      if (res.success && res.code) {
        sound.playComplete();
        onRoomCreated(res.code, res.state);
      } else {
        setError(res.error || 'Failed to create room.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating game room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative">
        <button
          onClick={() => { sound.playClick(); onNavigate('/'); }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-pink flex items-center justify-center shadow-glow-purple">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Create Game Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Customize your private multiplayer session
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={20}
              required
              className="w-full px-4 py-3.5 rounded-2xl glass-panel border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 text-base font-semibold transition-all"
            />
          </div>

          <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {gameModes.map((item) => {
                const isSelected = mode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => { sound.playClick(); setMode(item.mode); }}
                    className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-neon-purple/20 border-neon-purple text-white shadow-glow-purple'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="font-display font-bold text-xs text-white">{item.mode}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Difficulty
              </label>
              <div className="flex rounded-xl glass-panel p-1 border border-white/10 gap-1">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => { sound.playClick(); setDifficulty(diff); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      difficulty === diff
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Total Rounds: <span className="text-neon-pink font-bold">{maxRounds}</span>
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { sound.playClick(); setMaxRounds(r); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      maxRounds === r
                        ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/50 shadow-glow-pink'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {r} Rds
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neon-cyan" />
                <span>Timer per Turn</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {timerOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => { sound.playClick(); setTimerDuration(opt.value); }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                      timerDuration === opt.value
                        ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 shadow-glow-cyan'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-neon-amber" />
                <span>Skips Allowed</span>
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {skipOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => { sound.playClick(); setMaxSkips(opt.value); }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                      maxSkips === opt.value
                        ? 'bg-neon-amber/20 text-neon-amber border-neon-amber/50 shadow-glow-amber'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neon-purple" />
                <span>Question Categories ({categories.length})</span>
              </label>
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-[11px] font-bold text-neon-cyan hover:underline"
              >
                Select All
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-neon-purple/20 text-white border-neon-purple/50 shadow-glow-purple'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-neon-pink" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:opacity-95 text-white font-display font-black text-lg tracking-wider shadow-glow-purple hover:scale-[1.01] transition-all flex items-center justify-center gap-2 btn-3d disabled:opacity-50"
          >
            {loading ? (
              <span>CREATING ROOM...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-white" />
                <span>CREATE ROOM</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
