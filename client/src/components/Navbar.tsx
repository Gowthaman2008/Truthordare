import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Flame, Wifi, WifiOff, Settings, X, Check, Globe } from 'lucide-react';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [isConnected, setIsConnected] = useState<boolean>(socketService.socket.connected);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [serverInputUrl, setServerInputUrl] = useState<string>(socketService.currentUrl);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketService.socket.on('connect', handleConnect);
    socketService.socket.on('disconnect', handleDisconnect);

    return () => {
      socketService.socket.off('connect', handleConnect);
      socketService.socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    socketService.setServerUrl(serverInputUrl);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsServerModalOpen(false);
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <button 
          onClick={() => { sound.playClick(); onNavigate('/'); }}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-neon-purple via-neon-pink to-neon-cyan flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform flex-shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-base sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
                TRUTH & DARE
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">
              Two friends. One room. Endless fun.
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
            {/* Connection Status Pill (Clickable for Server Settings) */}
          <button
            onClick={() => {
              sound.playClick();
              setServerInputUrl(socketService.currentUrl);
              setIsServerModalOpen(true);
            }}
            title="Click to view network & backend settings"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border transition-all hover:scale-105 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{isConnected ? '🟢 Server Live' : '🟢 Vercel Ready'}</span>
          </button>

          {/* How to Play button */}
          <button
            onClick={() => { sound.playClick(); onNavigate('/how-to-play'); }}
            className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all border ${
              currentRoute === '/how-to-play'
                ? 'bg-white/15 text-white border-white/30 shadow-glow-purple'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-cyan" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-cyan" />
            )}
          </button>
        </div>

      </div>

      {/* Server Backend Config Modal */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-neon-purple/20 text-neon-purple flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Network & Server
                  </h3>
                  <p className="text-[11px] text-slate-400">100% Serverless Vercel Realtime</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsServerModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4 text-emerald-300 text-xs leading-relaxed">
              🎉 <strong>Vercel Realtime Enabled!</strong> You do not need any external server! Two players can create rooms and play directly on Vercel anywhere in the world.
            </div>

            <form onSubmit={handleSaveServer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Optional Dedicated Server URL
                </label>
                <input
                  type="url"
                  value={serverInputUrl}
                  onChange={(e) => setServerInputUrl(e.target.value)}
                  placeholder="Optional (e.g. http://localhost:4000)"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-white/20 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setServerInputUrl('');
                    socketService.setServerUrl('');
                    setIsServerModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-bold"
                >
                  Use Vercel Direct
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-xs shadow-glow-purple flex items-center justify-center gap-1.5 btn-3d"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save URL</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
};
