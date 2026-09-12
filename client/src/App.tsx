import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ReactionOverlay } from './components/ReactionOverlay';
import { ScoreGainToast } from './components/ScoreGainToast';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { Results } from './pages/Results';
import { HowToPlay } from './pages/HowToPlay';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { socketService } from './services/socket';
import type { RoomState } from './types';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname || '/');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentSocketId, setCurrentSocketId] = useState<string>(() => socketService.getMyPlayerId());

  // Parse path & params on initial load
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Socket events & room state updates
  useEffect(() => {
    const handleConnect = () => {
      setCurrentSocketId(socketService.getMyPlayerId());
    };

    const handleRoomUpdated = (state: RoomState) => {
      setRoomState(state);
      // Auto-sync route based on authoritative phase
      if (state.phase === 'LOBBY') {
        navigateTo(`/room/${state.code}`, false);
      } else if (state.phase === 'CHOOSING' || state.phase === 'ANSWERING') {
        navigateTo(`/game/${state.code}`, false);
      } else if (state.phase === 'RESULTS') {
        navigateTo(`/results/${state.code}`, false);
      }
    };

    const handleGameStarted = (state: RoomState) => {
      setRoomState(state);
      navigateTo(`/game/${state.code}`, false);
    };

    const handleGameEnded = (state: RoomState) => {
      setRoomState(state);
      navigateTo(`/results/${state.code}`, false);
    };

    socketService.socket.on('connect', handleConnect);
    socketService.socket.on('roomUpdated', handleRoomUpdated);
    socketService.socket.on('gameStarted', handleGameStarted);
    socketService.socket.on('gameEnded', handleGameEnded);

    return () => {
      socketService.socket.off('connect', handleConnect);
      socketService.socket.off('roomUpdated', handleRoomUpdated);
      socketService.socket.off('gameStarted', handleGameStarted);
      socketService.socket.off('gameEnded', handleGameEnded);
    };
  }, []);

  const navigateTo = (path: string, pushHistory: boolean = true) => {
    if (pushHistory && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const queryParams = new URLSearchParams(window.location.search);
  const codeParam = queryParams.get('code') || '';

  const renderContent = () => {
    if (currentRoute === '/create') {
      return (
        <CreateRoom
          onNavigate={navigateTo}
          onRoomCreated={(code, state) => {
            if (state) setRoomState(state);
            navigateTo(`/room/${code}`);
          }}
        />
      );
    }

    if (currentRoute === '/join' || currentRoute.startsWith('/join')) {
      return (
        <JoinRoom
          initialCode={codeParam}
          onNavigate={navigateTo}
          onRoomJoined={(code, state) => {
            if (state) setRoomState(state);
            navigateTo(`/room/${code}`);
          }}
        />
      );
    }

    if (currentRoute === '/how-to-play') {
      return <HowToPlay onNavigate={navigateTo} />;
    }

    if (currentRoute === '/privacy') {
      return <Privacy onNavigate={navigateTo} />;
    }

    if (currentRoute === '/terms') {
      return <Terms onNavigate={navigateTo} />;
    }

    // Room Routes
    if (currentRoute.startsWith('/room/') || currentRoute.startsWith('/game/') || currentRoute.startsWith('/results/')) {
      if (!roomState) {
        const extractedCode = currentRoute.split('/')[2];
        return (
          <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 text-center">
            <div className="p-8 rounded-3xl glass-card max-w-md border border-white/10 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-neon-purple/20 text-neon-purple flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce">
                🎲
              </div>
              <h3 className="font-display font-black text-2xl text-white mb-2">
                Connecting to Room...
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Room Code: <span className="font-bold text-neon-cyan">{extractedCode}</span>
              </p>
              <button
                onClick={() => navigateTo(`/join?code=${extractedCode}`)}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-sm shadow-glow-purple btn-3d"
              >
                Join with Name & Avatar
              </button>
            </div>
          </div>
        );
      }

      if (roomState.phase === 'LOBBY') {
        return (
          <Lobby
            roomState={roomState}
            currentSocketId={currentSocketId}
            onNavigate={navigateTo}
          />
        );
      }

      if (roomState.phase === 'CHOOSING' || roomState.phase === 'ANSWERING' || roomState.phase === 'COMPLETED') {
        return (
          <Game
            roomState={roomState}
            currentSocketId={currentSocketId}
            onNavigate={navigateTo}
          />
        );
      }

      if (roomState.phase === 'RESULTS') {
        return (
          <Results
            roomState={roomState}
            currentSocketId={currentSocketId}
            onNavigate={navigateTo}
          />
        );
      }
    }

    return <Home onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100 selection:bg-neon-pink selection:text-white">
      <BackgroundEffects />
      <ReactionOverlay />
      <ScoreGainToast />
      <Navbar onNavigate={navigateTo} currentRoute={currentRoute} />
      <main className="flex-1 relative z-10">
        {renderContent()}
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default App;
