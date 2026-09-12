import React, { useState } from 'react';
import { 
  Copy, Check, QrCode, Play, Plus, MessageSquare, Flame 
} from 'lucide-react';
import { QRCodeModal } from '../components/QRCodeModal';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import type { RoomState, Difficulty } from '../types';

interface LobbyProps {
  roomState: RoomState;
  currentSocketId: string;
  onNavigate: (route: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ roomState, currentSocketId }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Custom Question Form State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customType, setCustomType] = useState<'truth' | 'dare'>('truth');
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState('Friendship');
  const [customDifficulty] = useState<Difficulty>('Normal');

  const p1 = roomState.players[0];
  const p2 = roomState.players[1];
  const isHost = p1?.id === currentSocketId;
  const isFull = roomState.players.length === 2;

  const copyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(roomState.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyInviteLink = async () => {
    sound.playClick();
    const link = `${window.location.origin}/join?code=${roomState.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartGame = () => {
    sound.playClick();
    console.log('[Lobby] Starting game for room:', roomState.code);
    socketService.startGame(roomState.code);
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim().length < 5) return;

    sound.playComplete();
    socketService.addCustomQuestion({
      type: customType,
      category: customCategory,
      difficulty: customDifficulty,
      text: customText.trim(),
    });

    setCustomText('');
    setIsCustomModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] py-3 sm:py-6 px-2 sm:px-4 max-w-5xl mx-auto flex flex-col items-center">
      
      {/* Top Room Banner */}
      <div className="w-full text-center mb-4 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full glass-card border-white/10 text-[10px] sm:text-xs text-slate-300 font-semibold mb-2">
          <span>PRIVATE MULTIPLAYER ROOM</span>
        </div>
        
        <h2 className="font-display font-black text-2xl sm:text-5xl text-white mb-1.5 sm:mb-2">
          GAME LOBBY
        </h2>

        {/* Room Code Card */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-4">
          <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl glass-panel border border-neon-purple/40 shadow-glow-purple">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider sm:tracking-widest">
              Room Code:
            </span>
            <span className="font-display font-black text-xl sm:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
              {roomState.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={copyCode}
              className="p-2 sm:p-3 rounded-xl glass-card hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold btn-3d"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={copyInviteLink}
              className="p-2 sm:p-3 rounded-xl glass-card hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold btn-3d"
              title="Copy Invite Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-pink" />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>

            <button
              onClick={() => { sound.playClick(); setIsQRModalOpen(true); }}
              className="p-2 sm:p-3 rounded-xl glass-card hover:bg-white/15 text-neon-cyan hover:text-white border border-neon-cyan/30 transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold btn-3d"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Players Duel Grid - Side by Side on Mobile */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-6 mb-4 sm:mb-8">
        
        {/* Player 1 Card (Host) */}
        <div className={`relative p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-card border transition-all flex flex-col items-center text-center ${
          p1?.isConnected ? 'border-neon-purple/50 shadow-glow-purple' : 'border-white/10 opacity-70'
        }`}>
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30 text-[8px] sm:text-[10px] font-black uppercase tracking-wider">
            Host
          </div>

          <div className="text-4xl sm:text-7xl mt-4 sm:mt-0 mb-2 sm:mb-4 select-none">
            {p1?.avatar || '🧑'}
          </div>

          <h3 className="font-display font-black text-sm sm:text-2xl text-white mb-1 sm:mb-2 truncate max-w-[120px] sm:max-w-none">
            {p1?.name || 'Player 1'}
          </h3>

          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready</span>
          </div>
        </div>

        {/* Player 2 Card (Friend) */}
        <div className={`relative p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-card border transition-all flex flex-col items-center text-center ${
          p2 ? 'border-neon-cyan/50 shadow-glow-cyan' : 'border-dashed border-white/20'
        }`}>
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 text-[8px] sm:text-[10px] font-black uppercase tracking-wider">
            Friend
          </div>

          {p2 ? (
            <>
              <div className="text-4xl sm:text-7xl mt-4 sm:mt-0 mb-2 sm:mb-4 select-none">
                {p2.avatar}
              </div>

              <h3 className="font-display font-black text-sm sm:text-2xl text-white mb-1 sm:mb-2 truncate max-w-[120px] sm:max-w-none">
                {p2.name}
              </h3>

              <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready</span>
              </div>
            </>
          ) : (
            <div className="py-2 sm:py-6 flex flex-col items-center mt-3 sm:mt-0">
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl sm:text-3xl mb-2 sm:mb-4 animate-bounce">
                ⏳
              </div>
              <h3 className="font-display font-bold text-xs sm:text-xl text-slate-300 mb-1">
                Waiting...
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 max-w-xs">
                Code: <strong className="text-neon-cyan">{roomState.code}</strong>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Settings & Custom Questions Summary Bar */}
      <div className="w-full glass-card rounded-2xl p-3 sm:p-5 border border-white/10 mb-4 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Settings Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mr-1">Settings:</span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-neon-purple">
            Mode: {roomState.settings.mode}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-neon-cyan">
            Rounds: {roomState.settings.maxRounds}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-neon-amber">
            Timer: {roomState.settings.timerDuration ? `${roomState.settings.timerDuration}s` : 'None'}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold text-neon-pink">
            Skips: {roomState.settings.maxSkips === -1 ? 'Unlimited' : roomState.settings.maxSkips}
          </span>
        </div>

        {/* Custom Questions Button */}
        <button
          onClick={() => { sound.playClick(); setIsCustomModalOpen(true); }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-neon-pink/30 text-neon-pink text-xs font-bold flex items-center gap-1.5 transition-all btn-3d"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Add Custom Prompt ({roomState.customQuestions.length})</span>
        </button>

      </div>

      {/* Start Game Action */}
      <div className="w-full max-w-md flex flex-col items-center">
        {isFull ? (
          <button
            onClick={handleStartGame}
            className="w-full py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan hover:opacity-95 text-white font-display font-black text-base sm:text-xl tracking-wider shadow-glow-purple hover:scale-[1.02] transition-all flex items-center justify-center gap-2 sm:gap-3 btn-3d animate-pulse"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            <span>START GAME NOW</span>
          </button>
        ) : (
          <div className="w-full p-3 sm:p-4 rounded-2xl glass-card border border-white/10 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Share the room code with your friend to begin!</span>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomCode={roomState.code}
      />

      {/* Custom Questions Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl relative">
            <h3 className="font-display font-black text-xl text-white mb-1">
              Add Custom Question
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a secret custom Truth or Dare for this match
            </p>

            <form onSubmit={handleAddCustomQuestion} className="space-y-4">
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { sound.playClick(); setCustomType('truth'); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                    customType === 'truth'
                      ? 'bg-neon-purple/20 text-neon-purple border-neon-purple shadow-glow-purple'
                      : 'bg-white/5 text-slate-400 border-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>💬 TRUTH</span>
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playClick(); setCustomType('dare'); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                    customType === 'dare'
                      ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan shadow-glow-cyan'
                      : 'bg-white/5 text-slate-400 border-white/5'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>🔥 DARE</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Question / Challenge Text
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={customType === 'truth' ? "e.g. What is the biggest secret you've kept from me?" : "e.g. Sing our favorite song in high pitch for 15s!"}
                  rows={3}
                  maxLength={180}
                  required
                  className="w-full px-3 py-2.5 rounded-xl glass-panel border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-neon-pink text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-panel border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-neon-cyan"
                >
                  <option value="Flirty & Crush">Flirty & Crush</option>
                  <option value="Romantic & Cute">Romantic & Cute</option>
                  <option value="Funny & Teasing">Funny & Teasing</option>
                  <option value="Secrets & Confessions">Secrets & Confessions</option>
                  <option value="First Impressions">First Impressions</option>
                  <option value="Voice & Singing">Voice & Singing</option>
                  <option value="Camera & Cute Poses">Camera & Cute Poses</option>
                  <option value="Compliments">Compliments</option>
                  <option value="Playful & Teasing">Playful & Teasing</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { sound.playClick(); setIsCustomModalOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-xs shadow-glow-purple btn-3d"
                >
                  Add Prompt
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
