import { io, Socket } from 'socket.io-client';
import type { RoomState, GameSettings, Difficulty, ChatMessage, Question, Player } from '../types';
import { p2pRoomManager } from './p2pRoomManager';

const isDev = import.meta.env.DEV;

export const getServerUrl = (): string => {
  const custom = localStorage.getItem('td_custom_server_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  return import.meta.env.VITE_SERVER_URL || (isDev ? 'http://localhost:4000' : '');
};

type EventHandler = (...args: any[]) => void;

class SocketService {
  public socket: Socket;
  public currentUrl: string;
  private isP2PMode: boolean = false;
  private customEventHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor() {
    this.currentUrl = getServerUrl();
    this.socket = io(this.currentUrl || 'http://localhost:4000', {
      autoConnect: !!this.currentUrl,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    this.setupListeners();
    this.setupP2PBridge();
  }

  private setupP2PBridge() {
    p2pRoomManager.subscribe(
      (state: RoomState) => {
        this.triggerLocalEvent('roomUpdated', state);
        if (state.phase === 'CHOOSING' || state.phase === 'ANSWERING') {
          this.triggerLocalEvent('gameStarted', state);
        } else if (state.phase === 'RESULTS') {
          this.triggerLocalEvent('gameEnded', state);
        }
        if (state.timerRemaining !== null) {
          this.triggerLocalEvent('timerTick', { remaining: state.timerRemaining, total: state.settings.timerDuration });
        }
      },
      (msg: ChatMessage) => {
        this.triggerLocalEvent('chatMessage', msg);
      },
      (spinData) => {
        this.triggerLocalEvent('bottleSpun', spinData);
      },
      (actionData) => {
        this.triggerLocalEvent('actionChosen', actionData);
      },
      (typingText) => {
        this.triggerLocalEvent('liveAnswerUpdated', { text: typingText });
      }
    );
  }

  public on(event: string, handler: EventHandler) {
    if (!this.customEventHandlers.has(event)) {
      this.customEventHandlers.set(event, new Set());
    }
    this.customEventHandlers.get(event)!.add(handler);
    this.socket.on(event, handler);
  }

  public off(event: string, handler: EventHandler) {
    const handlers = this.customEventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
    this.socket.off(event, handler);
  }

  private triggerLocalEvent(event: string, ...args: any[]) {
    const handlers = this.customEventHandlers.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`Error in local handler for ${event}:`, e);
        }
      });
    }
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      console.log(`[SocketService] Connected to game server (${this.socket.id}) at ${this.currentUrl}`);
      this.isP2PMode = false;
      this.triggerLocalEvent('connect');
      this.checkAndRestoreSession();
    });

    this.socket.on('connect_error', (err) => {
      console.warn(`[SocketService] Connection error to ${this.currentUrl}:`, err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[SocketService] Disconnected:`, reason);
      this.triggerLocalEvent('disconnect', reason);
    });
  }

  public setServerUrl(newUrl: string) {
    const cleanUrl = newUrl.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('td_custom_server_url', cleanUrl);
    } else {
      localStorage.removeItem('td_custom_server_url');
    }
    this.currentUrl = getServerUrl();
    this.socket.disconnect();
    this.socket = io(this.currentUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
    this.setupListeners();
    this.socket.connect();
  }

  public saveSession(code: string, token: string) {
    localStorage.setItem('td_room_code', code.toUpperCase());
    localStorage.setItem('td_session_token', token);
  }

  public clearSession() {
    localStorage.removeItem('td_room_code');
    localStorage.removeItem('td_session_token');
  }

  public getSavedSession(): { code: string; token: string } | null {
    const code = localStorage.getItem('td_room_code');
    const token = localStorage.getItem('td_session_token');
    if (code && token) {
      return { code, token };
    }
    return null;
  }

  public checkAndRestoreSession() {
    const session = this.getSavedSession();
    if (session && this.socket.connected) {
      this.socket.emit('reconnectSession', session, (res: { success: boolean; state?: RoomState }) => {
        if (!res.success) {
          console.log('[SocketService] Previous session invalid, clearing.');
          this.clearSession();
        } else {
          console.log('[SocketService] Session restored for room:', session.code);
        }
      });
    }
  }

  public async createRoom(name: string, avatar: string, settings: Partial<GameSettings>): Promise<{ success: boolean; code?: string; token?: string; state?: RoomState; error?: string }> {
    // If Socket.IO is connected, use it
    if (this.socket.connected) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.fallbackCreateP2P(name, avatar, settings).then(resolve);
        }, 3000);

        this.socket.emit('createRoom', { name, avatar, settings }, (res: { success: boolean; code?: string; token?: string; state?: RoomState; error?: string }) => {
          clearTimeout(timeout);
          if (res.success && res.code && res.token) {
            this.saveSession(res.code, res.token);
          }
          resolve(res);
        });
      });
    }

    // Default / Serverless Vercel: Use P2P Room Manager
    return this.fallbackCreateP2P(name, avatar, settings);
  }

  private async fallbackCreateP2P(name: string, avatar: string, settings: Partial<GameSettings>) {
    this.isP2PMode = true;
    console.log('[SocketService] Creating P2P Serverless Room on Vercel...');
    const res = await p2pRoomManager.createRoom(name, avatar, settings);
    if (res.success && res.code) {
      this.saveSession(res.code, 'p2p_host_token');
      this.triggerLocalEvent('connect');
    }
    return {
      success: res.success,
      code: res.code,
      token: 'p2p_host_token',
      state: res.state,
      error: res.error,
    };
  }

  public async joinRoom(code: string, name: string, avatar: string): Promise<{ success: boolean; state?: RoomState; token?: string; error?: string }> {
    const cleanCode = code.toUpperCase().trim();

    if (this.socket.connected) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.fallbackJoinP2P(cleanCode, name, avatar).then(resolve);
        }, 3000);

        this.socket.emit('joinRoom', { code: cleanCode, name, avatar }, (res: { success: boolean; state?: RoomState; token?: string; error?: string }) => {
          clearTimeout(timeout);
          if (res.success && res.token) {
            this.saveSession(cleanCode, res.token);
            resolve(res);
          } else {
            this.fallbackJoinP2P(cleanCode, name, avatar).then(resolve);
          }
        });
      });
    }

    return this.fallbackJoinP2P(cleanCode, name, avatar);
  }

  private async fallbackJoinP2P(code: string, name: string, avatar: string) {
    this.isP2PMode = true;
    console.log('[SocketService] Joining P2P Serverless Room on Vercel:', code);
    const res = await p2pRoomManager.joinRoom(code, name, avatar);
    if (res.success && res.state) {
      this.saveSession(code, 'p2p_guest_token');
      this.triggerLocalEvent('connect');
    }
    return {
      success: res.success,
      state: res.state,
      token: 'p2p_guest_token',
      error: res.error,
    };
  }

  public reconnect(code: string, token: string): Promise<{ success: boolean; state?: RoomState; error?: string }> {
    if (this.socket.connected) {
      return new Promise((resolve) => {
        this.socket.emit('reconnectSession', { code: code.toUpperCase(), token }, (res: { success: boolean; state?: RoomState; error?: string }) => {
          if (res.success) {
            this.saveSession(code.toUpperCase(), token);
          }
          resolve(res);
        });
      });
    }
    return Promise.resolve({ success: false, error: 'Reconnection unavailable' });
  }

  public toggleReady(code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.toggleReady();
    } else {
      const session = this.getSavedSession();
      this.socket.emit('toggleReady', { code: code || session?.code });
    }
  }

  public updateSettings(settings: Partial<GameSettings>, code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.updateSettings(settings);
    } else {
      const session = this.getSavedSession();
      this.socket.emit('updateSettings', { ...settings, code: code || session?.code });
    }
  }

  public addCustomQuestion(question: { type: 'truth' | 'dare'; category: string; difficulty: Difficulty; text: string }, code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.addCustomQuestion(question.text, question.type);
    } else {
      const session = this.getSavedSession();
      this.socket.emit('addCustomQuestion', { ...question, code: code || session?.code });
    }
  }

  public startGame(code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.startGame();
    } else {
      const session = this.getSavedSession();
      const roomCode = code || session?.code;
      console.log('[SocketService] Emitting startGame with code:', roomCode);
      this.socket.emit('startGame', { code: roomCode });
    }
  }

  public chooseType(choice: 'truth' | 'dare', code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.chooseAction(choice);
    } else {
      const session = this.getSavedSession();
      this.socket.emit('chooseType', { choice, code: code || session?.code });
    }
  }

  public typeAnswer(text: string, code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.liveTyping(text);
    } else {
      const session = this.getSavedSession();
      this.socket.emit('typeAnswer', { text, code: code || session?.code });
    }
  }

  public completeQuestion(data?: { answerText?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | 'voice'; mediaDuration?: number } | string, code?: string) {
    if (this.isP2PMode) {
      const text = typeof data === 'string' ? data : data?.answerText;
      p2pRoomManager.submitAnswer(text);
    } else {
      const session = this.getSavedSession();
      const roomCode = code || session?.code;
      if (typeof data === 'string') {
        this.socket.emit('completeQuestion', { answerText: data, code: roomCode });
      } else {
        this.socket.emit('completeQuestion', { ...(data || {}), code: roomCode });
      }
    }
  }

  public skipQuestion(code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.skipQuestion();
    } else {
      const session = this.getSavedSession();
      this.socket.emit('skipQuestion', { code: code || session?.code });
    }
  }

  public sendChatMessage(data: {
    text?: string;
    type?: 'text' | 'image' | 'video' | 'voice';
    mediaUrl?: string;
    mediaDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  } | string, code?: string) {
    if (this.isP2PMode) {
      if (typeof data === 'string') {
        p2pRoomManager.sendChatMessage({ text: data, type: 'text' });
      } else {
        p2pRoomManager.sendChatMessage(data);
      }
    } else {
      const session = this.getSavedSession();
      const roomCode = code || session?.code;
      if (typeof data === 'string') {
        this.socket.emit('sendChatMessage', { text: data, type: 'text', code: roomCode });
      } else {
        this.socket.emit('sendChatMessage', { ...data, code: roomCode });
      }
    }
  }

  public sendReaction(emoji: string, code?: string) {
    if (this.isP2PMode) {
      this.triggerLocalEvent('reactionReceived', { emoji, id: 'rx_' + Date.now() });
    } else {
      const session = this.getSavedSession();
      this.socket.emit('sendReaction', { emoji, code: code || session?.code });
    }
  }

  public playAgain(code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.restartGame();
    } else {
      const session = this.getSavedSession();
      this.socket.emit('playAgain', { code: code || session?.code });
    }
  }

  public resetToLobby(code?: string) {
    if (this.isP2PMode) {
      p2pRoomManager.leaveRoom();
    } else {
      const session = this.getSavedSession();
      this.socket.emit('resetToLobby', { code: code || session?.code });
    }
  }
}

export const socketService = new SocketService();
export const socket = socketService.socket;
