import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, RotateCcw, AlertTriangle, MessageCircle, Gamepad2, Image as ImageIcon, Video, Mic, Square, X
} from 'lucide-react';
import { ReactionToolbar } from '../components/ReactionOverlay';
import { GameChat } from '../components/GameChat';
import { sound } from '../services/sound';
import { socketService } from '../services/socket';
import type { RoomState } from '../types';

interface GameProps {
  roomState: RoomState;
  currentSocketId: string;
  onNavigate: (route: string) => void;
}

export const Game: React.FC<GameProps> = ({ roomState, currentSocketId }) => {
  const [localTimer, setLocalTimer] = useState<number | null>(roomState.timerRemaining);
  const [disconnectWarning, setDisconnectWarning] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [liveRemoteAnswer, setLiveRemoteAnswer] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'game' | 'chat'>('game');

  // Media proof attachment for answering
  const [answerMedia, setAnswerMedia] = useState<{
    type: 'image' | 'video' | 'voice';
    url: string;
  } | null>(null);
  const [isRecordingProof, setIsRecordingProof] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const answerImgInputRef = useRef<HTMLInputElement>(null);
  const answerVideoInputRef = useRef<HTMLInputElement>(null);
  const answerAudioInputRef = useRef<HTMLInputElement>(null);

  const p1 = roomState.players[0];
  const p2 = roomState.players[1];
  const myId = currentSocketId || socketService.getMyPlayerId();
  const isHostStored = localStorage.getItem('td_is_host') === 'true';
  const me = roomState.players.find((p) => p.id === myId) || 
             (isHostStored ? roomState.players.find((p) => p.isHost) : roomState.players.find((p) => !p.isHost)) || 
             p1;
  const activePlayer = roomState.players.find((p) => p.id === roomState.currentTurnPlayerId) || p1;
  const isMyTurn = Boolean(
    roomState.currentTurnPlayerId === me?.id || 
    roomState.currentTurnPlayerId === myId ||
    (me && activePlayer && me.name === activePlayer.name)
  );

  // Listen to timer ticks and warnings
  useEffect(() => {
    setLocalTimer(roomState.timerRemaining);
  }, [roomState.timerRemaining]);

  // Reset typed answer on new question
  useEffect(() => {
    setTypedAnswer('');
    setLiveRemoteAnswer('');
    setAnswerMedia(null);
  }, [roomState.activeQuestion?.id, roomState.phase]);

  useEffect(() => {
    const handleTimerTick = (remaining: number) => {
      setLocalTimer(remaining);
      if (remaining <= 5 && remaining > 0) {
        sound.playTimerWarning();
      } else if (remaining > 5 && remaining % 5 === 0) {
        sound.playTimerTick();
      }
    };

    const handleTimeUp = () => {
      sound.playTimeUp();
    };

    const handleLiveAnswer = (data: { playerId: string; text: string }) => {
      if (data.playerId !== currentSocketId) {
        setLiveRemoteAnswer(data.text);
      }
    };

    const handleDisconnectNotice = (data: { playerName: string }) => {
      setDisconnectWarning(`${data.playerName} disconnected. Waiting for reconnection...`);
    };

    const handleReconnectNotice = () => {
      setDisconnectWarning(null);
      sound.playComplete();
    };

    socketService.socket.on('timerTick', handleTimerTick);
    socketService.socket.on('timeUp', handleTimeUp);
    socketService.socket.on('liveAnswerUpdated', handleLiveAnswer);
    socketService.socket.on('playerDisconnectedNotice', handleDisconnectNotice);
    socketService.socket.on('playerReconnectedNotice', handleReconnectNotice);

    return () => {
      socketService.socket.off('timerTick', handleTimerTick);
      socketService.socket.off('timeUp', handleTimeUp);
      socketService.socket.off('liveAnswerUpdated', handleLiveAnswer);
      socketService.socket.off('playerDisconnectedNotice', handleDisconnectNotice);
      socketService.socket.off('playerReconnectedNotice', handleReconnectNotice);
    };
  }, [currentSocketId]);

  const handleChooseTruth = () => {
    if (!isMyTurn) return;
    sound.playTruthSelected();
    socketService.chooseType('truth');
  };

  const handleChooseDare = () => {
    if (!isMyTurn) return;
    sound.playDareSelected();
    socketService.chooseType('dare');
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTypedAnswer(val);
    socketService.typeAnswer(val);
  };

  const handleInsertEmoji = (emoji: string) => {
    const updated = typedAnswer + emoji;
    setTypedAnswer(updated);
    socketService.typeAnswer(updated);
  };

  const handleAnswerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setAnswerMedia({
          type: 'image',
          url: compressedDataUrl
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAnswerVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Video file is too large. Please select a clip under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAnswerMedia({
        type: 'video',
        url: reader.result as string
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAnswerAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Audio file is too large. Please select a clip under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAnswerMedia({
        type: 'voice',
        url: reader.result as string
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Record voice note answer proof
  const startRecordingProof = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser. Please use the Audio attachment button to upload a voice clip.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      audioChunksRef.current = [];

      let chosenMime = '';
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/aac'
      ];
      for (const candidate of mimeCandidates) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
          chosenMime = candidate;
          break;
        }
      }

      const options: MediaRecorderOptions = chosenMime ? { mimeType: chosenMime } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || chosenMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAnswerMedia({
            type: 'voice',
            url: reader.result as string
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      };

      mediaRecorder.start(200);
      setIsRecordingProof(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone access notice: ${err?.message || 'Please enable microphone permissions in your browser.'}`);
    }
  };

  const stopRecordingProof = () => {
    if (mediaRecorderRef.current && isRecordingProof) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      setIsRecordingProof(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handleComplete = () => {
    if (!isMyTurn) return;
    sound.playComplete();
    socketService.completeQuestion({
      answerText: typedAnswer.trim(),
      mediaUrl: answerMedia?.url,
      mediaType: answerMedia?.type
    });
    setTypedAnswer('');
    setAnswerMedia(null);
  };

  const handleSkip = () => {
    if (!isMyTurn) return;
    sound.playSkip();
    socketService.skipQuestion();
    setTypedAnswer('');
    setAnswerMedia(null);
  };

  const handleSendReaction = (emoji: string) => {
    socketService.sendReaction(emoji);
  };

  // Timer Circle Calculations
  const totalTime = roomState.timerTotal || 30;
  const currentTime = localTimer !== null ? localTimer : totalTime;
  const progressPercent = Math.max(0, Math.min(100, (currentTime / totalTime) * 100));
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;
  const isTimeLow = currentTime <= 5 && currentTime > 0;
  const isTimeZero = currentTime === 0;

  const quickEmojis = ['❤️', '😂', '🙈', '🔥', '✨', '🥺', '💋', '😏'];

  return (
    <div className="min-h-[calc(100vh-120px)] py-2 sm:py-4 px-2 sm:px-4 max-w-7xl mx-auto flex flex-col justify-between">
      
      {/* Disconnect Warning Banner */}
      {disconnectWarning && (
        <div className="w-full mb-3 p-2.5 sm:p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{disconnectWarning}</span>
        </div>
      )}

      {/* Top Header: Scoreboard & Round Indicator */}
      <div className="w-full mb-3">
        
        {/* Mobile Tab Switcher & Round Info */}
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-display font-black text-[10px] sm:text-xs tracking-wider text-slate-200">
              ROUND {String(roomState.currentRound).padStart(2, '0')} / {roomState.settings.maxRounds}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">
              Mode: {roomState.settings.mode}
            </span>
          </div>

          {/* Prominent Mobile Segmented Switcher */}
          <div className="flex items-center gap-1 lg:hidden bg-black/40 p-1 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab('game')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'game' 
                  ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-md shadow-neon-pink/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all relative ${
                activeTab === 'chat' 
                  ? 'bg-gradient-to-r from-neon-pink to-rose-500 text-white shadow-md shadow-rose-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat</span>
              {(roomState.chatMessages?.length || 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                  {roomState.chatMessages?.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Live Match</span>
          </div>
        </div>

        {/* Dual Players Scoreboard Card */}
        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          
          {/* Player 1 Card */}
          <div className={`p-2.5 sm:p-4 rounded-2xl glass-card transition-all relative overflow-hidden ${
            roomState.currentTurnPlayerId === p1?.id
              ? 'glow-border-purple ring-2 ring-neon-purple/50 bg-[#171a33]'
              : 'border-white/5 opacity-85'
          }`}>
            {roomState.currentTurnPlayerId === p1?.id && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-neon-purple/30 text-neon-purple text-[8px] sm:text-[9px] font-black tracking-wider uppercase border border-neon-purple/40">
                TURN
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl select-none flex-shrink-0">{p1?.avatar || '🧑'}</div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-xs sm:text-base text-white flex items-center gap-1 truncate">
                  <span className="truncate">{p1?.name || 'Player 1'}</span>
                  {p1?.id === currentSocketId && (
                    <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1">
                  <span className="font-display font-black text-sm sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">
                    {p1?.score || 0} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">PTS</span>
                  </span>
                  {(p1?.streak || 0) > 1 && (
                    <span className="text-[9px] font-black uppercase bg-neon-pink/20 text-neon-pink px-1.5 py-0.2 rounded-full border border-neon-pink/30 flex items-center gap-0.5">
                      🔥 {p1?.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div className={`p-2.5 sm:p-4 rounded-2xl glass-card transition-all relative overflow-hidden ${
            roomState.currentTurnPlayerId === p2?.id
              ? 'glow-border-cyan ring-2 ring-neon-cyan/50 bg-[#131b33]'
              : 'border-white/5 opacity-85'
          }`}>
            {roomState.currentTurnPlayerId === p2?.id && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-neon-cyan/30 text-neon-cyan text-[8px] sm:text-[9px] font-black tracking-wider uppercase border border-neon-cyan/40">
                TURN
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl select-none flex-shrink-0">{p2?.avatar || '👩'}</div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-xs sm:text-base text-white flex items-center gap-1 truncate">
                  <span className="truncate">{p2?.name || 'Player 2'}</span>
                  {p2?.id === currentSocketId && (
                    <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1">
                  <span className="font-display font-black text-sm sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-blue">
                    {p2?.score || 0} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">PTS</span>
                  </span>
                  {(p2?.streak || 0) > 1 && (
                    <span className="text-[9px] font-black uppercase bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.2 rounded-full border border-neon-cyan/30 flex items-center gap-0.5">
                      🔥 {p2?.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Main Interactive Play Area with Side-by-Side / Tabbed Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 my-1 sm:my-2 items-start">
        
        {/* LEFT COLUMN: ACTIVE GAMEPLAY */}
        <div className={`lg:col-span-7 flex flex-col items-center justify-center w-full ${
          activeTab === 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* PHASE 1: CHOOSING TRUTH OR DARE */}
          {roomState.phase === 'CHOOSING' && (
            <div className="w-full flex flex-col items-center animate-fade-in py-1 sm:py-4">
              
              {/* Turn Prompt */}
              <div className="text-center mb-3 sm:mb-6">
                <h3 className="font-display font-black text-lg sm:text-3xl text-white mb-1 sm:mb-2">
                  {isMyTurn ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan">
                      Your Turn! Choose Truth or Dare
                    </span>
                  ) : (
                    <span>Waiting for {activePlayer.name} to choose...</span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-400">
                  {isMyTurn ? "Pick a challenge, type your answer or share media in chat!" : "Get ready to see their answer in the chat!"}
                </p>
              </div>

              {/* Responsive 3D Choice Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-6 w-full max-w-xl">
                
                {/* TRUTH CARD */}
                <button
                  type="button"
                  disabled={!isMyTurn}
                  onClick={handleChooseTruth}
                  className={`group relative p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-card transition-all text-left flex flex-col justify-between min-h-[140px] sm:min-h-[240px] ${
                    isMyTurn
                      ? 'hover:scale-105 active:scale-95 border-neon-purple/50 hover:border-neon-purple shadow-glow-purple cursor-pointer'
                      : 'opacity-50 cursor-not-allowed border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neon-purple/20 flex items-center justify-center text-xl sm:text-2xl group-hover:rotate-12 transition-transform shadow-glow-purple">
                      💬
                    </div>
                    <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                      +10 PTS
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-black text-lg sm:text-3xl text-white group-hover:text-neon-purple transition-colors mb-0.5 sm:mb-1">
                      TRUTH
                    </h4>
                    <p className="text-[10px] sm:text-sm text-slate-300 line-clamp-2">
                      Honest confession in chat box.
                    </p>
                  </div>

                  <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <span>Honesty</span>
                    <span>✨</span>
                  </div>
                </button>

                {/* DARE CARD */}
                <button
                  type="button"
                  disabled={!isMyTurn}
                  onClick={handleChooseDare}
                  className={`group relative p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-card transition-all text-left flex flex-col justify-between min-h-[140px] sm:min-h-[240px] ${
                    isMyTurn
                      ? 'hover:scale-105 active:scale-95 border-neon-cyan/50 hover:border-neon-cyan shadow-glow-cyan cursor-pointer'
                      : 'opacity-50 cursor-not-allowed border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-neon-cyan/20 flex items-center justify-center text-xl sm:text-2xl group-hover:-rotate-12 transition-transform shadow-glow-cyan">
                      🔥
                    </div>
                    <span className="text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                      +15 PTS
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-black text-lg sm:text-3xl text-white group-hover:text-neon-cyan transition-colors mb-0.5 sm:mb-1">
                      DARE
                    </h4>
                    <p className="text-[10px] sm:text-sm text-slate-300 line-clamp-2">
                      Send photo, voice, or funny text!
                    </p>
                  </div>

                  <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <span>Action</span>
                    <span>⚡</span>
                  </div>
                </button>

              </div>

            </div>
          )}

          {/* PHASE 2: ANSWERING ACTIVE QUESTION */}
          {roomState.phase === 'ANSWERING' && (() => {
            const activeQ = roomState.activeQuestion || {
              id: 'fallback_q_' + Date.now(),
              type: roomState.activeChoice || 'truth',
              category: 'Flirty & Cute',
              difficulty: 'Normal',
              text: roomState.activeChoice === 'truth'
                ? 'What was the first thing that attracted you to me?'
                : 'Send a cute 5-second voice note saying something sweet!'
            };
            return (
              <div className="w-full flex flex-col items-center animate-fade-in py-1 sm:py-2">
                
                <div className={`w-full p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-card border relative text-center mb-3 sm:mb-5 transition-all ${
                  (roomState.activeChoice || activeQ.type) === 'truth' 
                    ? 'border-neon-purple/50 shadow-glow-purple' 
                    : 'border-neon-cyan/50 shadow-glow-cyan'
                }`}>
                  
                  {/* Question Badges */}
                  <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
                    <span className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                      (roomState.activeChoice || activeQ.type) === 'truth'
                        ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/40'
                        : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
                    }`}>
                      {(roomState.activeChoice || activeQ.type) === 'truth' ? '💬 TRUTH' : '🔥 DARE'}
                    </span>

                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-slate-300">
                      {activeQ.category}
                    </span>

                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-amber-400">
                      {activeQ.difficulty}
                    </span>

                    {activeQ.isCustom && (
                      <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/30 text-[10px] font-black uppercase">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className="font-display font-extrabold text-base sm:text-2xl text-white leading-snug mb-3 sm:mb-5">
                    "{activeQ.text}"
                  </h3>

                {/* Timer Circle */}
                {roomState.settings.timerDuration > 0 && (
                  <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke={isTimeLow || isTimeZero ? '#f43f5e' : (roomState.activeChoice === 'truth' ? '#a855f7' : '#06b6d4')}
                          strokeWidth="8"
                          strokeDasharray="264"
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className={`font-display font-black text-sm sm:text-lg ${
                          isTimeLow || isTimeZero ? 'text-rose-400 animate-ping' : 'text-white'
                        }`}>
                          {currentTime}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE TYPING & MEDIA PROOF INPUT */}
                {isMyTurn ? (
                  <div className="w-full text-left mt-1 sm:mt-2">
                    
                    {/* Hidden inputs for answer proof */}
                    <input 
                      type="file" 
                      ref={answerImgInputRef} 
                      accept="image/*" 
                      onChange={handleAnswerImage} 
                      className="hidden" 
                    />
                    <input 
                      type="file" 
                      ref={answerVideoInputRef} 
                      accept="video/*" 
                      onChange={handleAnswerVideo} 
                      className="hidden" 
                    />
                    <input 
                      type="file" 
                      ref={answerAudioInputRef} 
                      accept="audio/*" 
                      onChange={handleAnswerAudio} 
                      className="hidden" 
                    />

                    <label className="block text-[11px] sm:text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-neon-pink">
                        ✍️ Type your answer:
                      </span>
                      <span className="text-[10px] text-slate-400">{typedAnswer.length} / 500</span>
                    </label>

                    <textarea
                      value={typedAnswer}
                      onChange={handleAnswerChange}
                      maxLength={500}
                      rows={2}
                      placeholder={
                        roomState.activeChoice === 'truth'
                          ? "Type your honest truth answer here..."
                          : "Type what you did / your answer / funny dare story..."
                      }
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-black/40 border border-white/20 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 text-white placeholder-slate-500 text-xs sm:text-sm outline-none resize-none transition-all"
                    />

                    {/* Answer Media Attachment Preview */}
                    {answerMedia && (
                      <div className="my-1.5 p-2 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2">
                          {answerMedia.type === 'image' ? (
                            <img src={answerMedia.url} alt="Proof" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border border-white/20" />
                          ) : answerMedia.type === 'video' ? (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-neon-cyan">
                              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          )}
                          <span className="text-[11px] sm:text-xs text-white font-medium">Attached {answerMedia.type} proof</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnswerMedia(null)}
                          className="p-1 rounded-full text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Media Attachments & Quick Emoji Bar */}
                    <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1.5">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => answerImgInputRef.current?.click()}
                          title="Attach Photo Proof"
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] sm:text-xs text-slate-300 hover:text-neon-pink flex items-center gap-1 transition-colors"
                        >
                          <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => answerVideoInputRef.current?.click()}
                          title="Attach Video Proof"
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] sm:text-xs text-slate-300 hover:text-neon-cyan flex items-center gap-1 transition-colors"
                        >
                          <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Video</span>
                        </button>
                        {isRecordingProof ? (
                          <button
                            type="button"
                            onClick={stopRecordingProof}
                            className="px-2 py-1 rounded-lg bg-rose-500 text-[10px] sm:text-xs text-white flex items-center gap-1 animate-pulse"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>Done ({recordDuration}s)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecordingProof}
                            title="Record Audio Proof"
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-[10px] sm:text-xs text-rose-300 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Voice</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Emojis */}
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {quickEmojis.slice(0, 5).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/5 hover:bg-white/15 text-[11px] sm:text-xs flex items-center justify-center transition-transform active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* LIVE TYPING PREVIEW FOR WATCHING PLAYER */
                  <div className="w-full text-left mt-2 sm:mt-3">
                    {liveRemoteAnswer ? (
                      <div className="p-3 sm:p-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-left animate-fade-in">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] sm:text-xs font-bold text-neon-cyan">
                          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
                          <span>{activePlayer.name} is typing live:</span>
                        </div>
                        <p className="text-white text-sm sm:text-base font-medium break-words">
                          "{liveRemoteAnswer}"<span className="animate-pulse">|</span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400 font-semibold">
                        👀 Watching <strong className="text-white">{activePlayer.name}</strong>... Get ready to reply in the chat!
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Action Buttons for Active Player */}
              {isMyTurn ? (
                <div className="w-full flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleComplete}
                    className="w-full sm:flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-white font-display font-black text-sm sm:text-lg tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 btn-3d"
                  >
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>
                      {typedAnswer.trim() || answerMedia ? 'SUBMIT & COMPLETE' : 'I DID IT! (COMPLETED)'}
                    </span>
                  </button>

                  <button
                    onClick={handleSkip}
                    disabled={roomState.settings.maxSkips !== -1 && me.skipsRemaining <= 0}
                    className="w-full sm:w-auto py-2.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl glass-card hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-1.5 btn-3d disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-amber" />
                    <span>
                      SKIP ({roomState.settings.maxSkips === -1 ? 'Unlimited' : `${me.skipsRemaining} Left`})
                    </span>
                  </button>
                </div>
              ) : (
                <div className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-white/10 text-center text-xs text-slate-400 font-semibold">
                  Waiting for <strong className="text-white">{activePlayer.name}</strong> to answer... You can reply in the chat!
                </div>
              )}

            </div>
          );
        })()}

        {/* Fallback loading view during round transitions */}
        {roomState.phase !== 'CHOOSING' && roomState.phase !== 'ANSWERING' && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <div className="text-3xl animate-bounce mb-2">🎲</div>
            <h3 className="font-display font-bold text-base text-white">Loading Round...</h3>
          </div>
        )}

        </div>

        {/* RIGHT COLUMN: DEDICATED LIVE CHAT & MEDIA BOX */}
        <div className={`lg:col-span-5 w-full ${
          activeTab === 'game' ? 'hidden lg:block' : 'block'
        }`}>
          <GameChat
            messages={roomState.chatMessages || []}
            currentSocketId={currentSocketId}
            players={roomState.players}
            activeChoice={roomState.activeChoice}
            activeQuestionText={roomState.activeQuestion?.text}
          />
        </div>

      </div>

      {/* Bottom Live Reaction Toolbar */}
      <div className="w-full flex justify-center py-2">
        <ReactionToolbar onSendReaction={handleSendReaction} />
      </div>

    </div>
  );
};
