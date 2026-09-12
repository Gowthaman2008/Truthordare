import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, Video, Mic, Square, X, Reply, 
  Play, Pause, Sparkles, MessageCircle, Maximize2
} from 'lucide-react';
import type { ChatMessage, Player } from '../types';
import { socketService } from '../services/socket';

interface GameChatProps {
  messages: ChatMessage[];
  currentSocketId: string;
  players: Player[];
  activeChoice?: 'truth' | 'dare' | null;
  activeQuestionText?: string | null;
}

export const GameChat: React.FC<GameChatProps> = ({
  messages,
  currentSocketId,
  players,
}) => {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Media Attachment state
  const [pendingMedia, setPendingMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    file: File;
  } | null>(null);

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Lightbox Modal state
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingMedia]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(a => {
        try {
          a.pause();
          a.src = '';
        } catch (e) {}
      });
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const recordDurationRef = useRef<number>(0);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser environment. You can use the Voice Memo file upload button to send an audio note.');
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

      // Detect best supported MIME type
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
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || chosenMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          socketService.sendChatMessage({
            type: 'voice',
            mediaUrl: base64data,
            mediaDuration: recordDurationRef.current || 1,
            replyTo: replyTo || undefined
          });
          setReplyTo(null);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      };

      // Request data in chunks of 200ms
      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);
      recordDurationRef.current = 0;

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => {
          const next = prev + 1;
          recordDurationRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('[GameChat] Error accessing microphone:', err);
      alert(`Microphone permission notice: ${err.message || 'Please enable microphone access in your browser settings.'}\n\nYou can also click the Audio button to upload any recorded voice clip.`);
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream?.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      } catch (e) {}
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      audioChunksRef.current = [];
    }
  };

  // Direct Audio File upload handler
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Audio file too large. Please select a clip under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      socketService.sendChatMessage({
        type: 'voice',
        mediaUrl: reader.result as string,
        mediaDuration: 5,
        replyTo: replyTo || undefined
      });
      setReplyTo(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Image Upload handler (with canvas compress)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setPendingMedia({
          type: 'image',
          url: compressedDataUrl,
          file
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video Upload handler
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Video file is too large. Please select a clip under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingMedia({
        type: 'video',
        url: reader.result as string,
        file
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send message handler
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pendingMedia) {
      socketService.sendChatMessage({
        type: pendingMedia.type,
        mediaUrl: pendingMedia.url,
        text: text.trim() || undefined,
        replyTo: replyTo || undefined
      });
      setPendingMedia(null);
      setText('');
      setReplyTo(null);
      return;
    }

    if (!text.trim()) return;

    socketService.sendChatMessage({
      type: 'text',
      text: text.trim(),
      replyTo: replyTo || undefined
    });

    setText('');
    setReplyTo(null);
  };

  // Audio play/pause toggle with restart & error handling
  const togglePlayAudio = (msgId: string, url: string) => {
    let audio = audioElementsRef.current[msgId];
    if (!audio) {
      audio = new Audio(url);
      audioElementsRef.current[msgId] = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setPlayingAudioId(null);
      };
    }

    if (playingAudioId === msgId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Pause others
      Object.entries(audioElementsRef.current).forEach(([k, a]) => {
        if (k !== msgId) {
          try {
            a.pause();
            a.currentTime = 0;
          } catch (e) {}
        }
      });

      // Rewind to beginning if ended
      if (audio.ended || (audio.duration && audio.currentTime >= audio.duration)) {
        audio.currentTime = 0;
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingAudioId(msgId);
          })
          .catch((err) => {
            console.error('Audio play blocked or unsupported:', err);
            setPlayingAudioId(null);
          });
      } else {
        setPlayingAudioId(msgId);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-230px)] lg:h-[480px] max-h-[600px] rounded-2xl sm:rounded-3xl glass-card border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl relative">
      
      {/* Chat Top Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neon-pink/20 border border-neon-pink/40 flex items-center justify-center text-neon-pink flex-shrink-0">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>Live Room Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-[9px] sm:text-[10px] text-slate-400">Share answers, photos, videos & voice notes</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {players.map((p) => (
            <span key={p.id} className="text-xs sm:text-sm px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white select-none" title={p.name}>
              {p.avatar}
            </span>
          ))}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Sparkles className="w-8 h-8 text-neon-pink/40 mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-slate-400">No messages yet!</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Answers, replies, voice notes, photos & videos sent by both players will appear right here.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentSocketId;
            const isAnswerCard = msg.type === 'answer' || msg.questionContext !== undefined;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group transition-all`}
              >
                {/* Replying indicator */}
                {msg.replyTo && (
                  <div className={`text-[10px] text-slate-400 flex items-center gap-1 mb-1 px-2 ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}>
                    <Reply className="w-3 h-3 text-neon-pink" />
                    <span>Replying to <strong className="text-slate-300">{msg.replyTo.senderName}</strong>: "{msg.replyTo.text.slice(0, 35)}..."</span>
                  </div>
                )}

                <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {/* Sender Avatar */}
                  <span className="text-lg select-none mb-1 flex-shrink-0">
                    {msg.avatar || '🧑'}
                  </span>

                  {/* Message Bubble Container */}
                  <div className={`relative p-3.5 rounded-2xl transition-all ${
                    isAnswerCard
                      ? (msg.questionContext?.choice === 'truth'
                          ? 'bg-gradient-to-br from-purple-950/80 to-slate-900/90 border border-neon-purple/50 shadow-glow-purple text-white'
                          : 'bg-gradient-to-br from-cyan-950/80 to-slate-900/90 border border-neon-cyan/50 shadow-glow-cyan text-white')
                      : isMe
                        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-br-sm shadow-md'
                        : 'bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 rounded-bl-sm'
                  }`}>
                    
                    {/* Header with Sender Name & Time */}
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-semibold">
                      <span>{msg.senderName}</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* TRUTH / DARE ANSWER CARD HEADER */}
                    {msg.questionContext && (
                      <div className="mb-2 p-2 rounded-xl bg-black/40 border border-white/10 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase mb-1">
                          <span className={msg.questionContext.choice === 'truth' ? 'text-neon-purple' : 'text-neon-cyan'}>
                            {msg.questionContext.choice === 'truth' ? '💬 TRUTH ANSWER' : '🔥 DARE ANSWER'}
                          </span>
                          <span className="text-emerald-400">+{msg.questionContext.points} PTS</span>
                        </div>
                        <p className="text-xs text-slate-300 italic">"{msg.questionContext.questionText}"</p>
                      </div>
                    )}

                    {/* PHOTO ATTACHMENT */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="relative my-1 rounded-xl overflow-hidden border border-white/15 group/img cursor-pointer max-w-sm">
                        <img 
                          src={msg.mediaUrl} 
                          alt="Shared attachment" 
                          className="w-full max-h-60 object-cover rounded-xl transition-transform group-hover/img:scale-105"
                          onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}
                        />
                        <button 
                          type="button"
                          onClick={() => setLightboxMedia({ type: 'image', url: msg.mediaUrl! })}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* VIDEO ATTACHMENT */}
                    {msg.type === 'video' && msg.mediaUrl && (
                      <div className="my-1 rounded-xl overflow-hidden border border-white/15 max-w-sm">
                        <video 
                          src={msg.mediaUrl} 
                          controls 
                          playsInline
                          className="w-full max-h-60 rounded-xl bg-black" 
                        />
                      </div>
                    )}

                    {/* VOICE NOTE ATTACHMENT */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <div className="my-1.5 p-2.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(msg.id, msg.mediaUrl!)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-lg ${
                              playingAudioId === msg.id 
                                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40' 
                                : 'bg-gradient-to-r from-neon-pink to-rose-500 text-white hover:scale-105 shadow-neon-pink/30'
                            }`}
                          >
                            {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          <div className="flex-1 min-w-[120px]">
                            <div className="flex items-center gap-1 h-5">
                              {[35, 75, 45, 95, 60, 85, 40, 100, 70, 50, 80, 60, 90, 45].map((h, i) => (
                                <span 
                                  key={i} 
                                  style={{ height: `${h}%` }}
                                  className={`w-1 rounded-full transition-all ${
                                    playingAudioId === msg.id ? 'bg-rose-400 animate-pulse' : 'bg-slate-400/60'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-300 font-bold block mt-1">
                              🎤 Voice Message {msg.mediaDuration ? `(${formatSeconds(msg.mediaDuration)})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Direct Native HTML5 Audio Player */}
                        <div className="w-full pt-1">
                          <audio 
                            controls 
                            playsInline 
                            src={msg.mediaUrl} 
                            className="w-full h-8 rounded-lg opacity-85 hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    )}

                    {/* TEXT CONTENT */}
                    {msg.text && (
                      <p className="text-sm font-medium leading-relaxed break-words text-left">
                        {msg.text}
                      </p>
                    )}

                    {/* Quick Reply Button on Hover */}
                    <button
                      type="button"
                      onClick={() => setReplyTo({
                        id: msg.id,
                        senderName: msg.senderName,
                        text: msg.text || (msg.type === 'image' ? '[Photo]' : msg.type === 'video' ? '[Video]' : '[Voice Note]')
                      })}
                      className="absolute -top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 border border-white/20 text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white flex items-center gap-1 shadow-lg"
                    >
                      <Reply className="w-2.5 h-2.5" />
                      <span>Reply</span>
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Media Preview Banner */}
      {pendingMedia && (
        <div className="px-4 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            {pendingMedia.type === 'image' ? (
              <img src={pendingMedia.url} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
                <Video className="w-5 h-5" />
              </div>
            )}
            <div className="text-xs text-slate-300 font-medium">
              <span>Ready to send {pendingMedia.type}</span>
              <span className="block text-[10px] text-slate-400 truncate max-w-[180px]">{pendingMedia.file.name}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingMedia(null)}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div className="px-4 py-2 bg-neon-pink/10 border-t border-neon-pink/30 flex items-center justify-between text-xs text-neon-pink font-semibold">
          <div className="flex items-center gap-1.5 truncate">
            <Reply className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Replying to <strong>{replyTo.senderName}</strong>: "{replyTo.text.slice(0, 40)}..."</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Input & Media Controls Bar */}
      <div className="p-2 sm:p-3 bg-white/5 border-t border-white/10 flex-shrink-0">
        
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          onChange={handleImageSelect} 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={videoInputRef} 
          accept="video/*" 
          onChange={handleVideoSelect} 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={audioFileInputRef} 
          accept="audio/*" 
          onChange={handleAudioSelect} 
          className="hidden" 
        />

        {isRecording ? (
          /* Live Recording Bar */
          <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-rose-950/40 border border-rose-500/50 animate-pulse">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-rose-400 min-w-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
              <span className="truncate">Recording: {formatSeconds(recordDuration)}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-500 hover:bg-rose-600 text-[10px] sm:text-xs font-black text-white flex items-center gap-1 shadow-lg shadow-rose-500/30"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Form */
          <form onSubmit={handleSend} className="flex items-center gap-1 sm:gap-2">
            
            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Send Photo"
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-neon-pink transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Video Attachment Button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              title="Send Video"
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-neon-cyan transition-colors flex-shrink-0"
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Voice Record Mic Button */}
            <button
              type="button"
              onClick={startRecording}
              title="Record Voice Note (Microphone)"
              className="p-2 sm:p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white transition-all hover:scale-105 flex-shrink-0"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.senderName}...` : "Type a message..."}
              maxLength={400}
              className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/40 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!text.trim() && !pendingMedia}
              className="p-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 text-white font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1 transition-all disabled:opacity-30 shadow-lg shadow-neon-pink/20 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>

          </form>
        )}

      </div>

      {/* Lightbox Modal for Photo / Video Zoom */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button
            type="button"
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden">
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} alt="Fullscreen preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
            ) : (
              <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-2xl bg-black" />
            )}
          </div>
        </div>
      )}

    </div>
  );
};
