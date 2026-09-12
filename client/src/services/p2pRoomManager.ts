import Peer, { DataConnection } from 'peerjs';
import type {
  RoomState,
  Player,
  GameSettings,
  ChatMessage,
  Question,
} from '../types';
import { localQuestionEngine } from './localQuestionEngine';

type StateCallback = (state: RoomState) => void;
type ChatCallback = (msg: ChatMessage) => void;
type BottleSpinCallback = (data: { selectedPlayerId: string; selectedPlayerName: string; rotation: number }) => void;
type ActionChosenCallback = (data: { choice: 'truth' | 'dare'; question: Question; player: Player }) => void;

interface P2PMessage {
  type:
    | 'SYNC_STATE'
    | 'JOIN_REQUEST'
    | 'JOIN_RESPONSE'
    | 'CHAT_MESSAGE'
    | 'BOTTLE_SPIN'
    | 'ACTION_CHOSEN'
    | 'LIVE_TYPING'
    | 'ACTION_EVENT'
    | 'LEAVE';
  payload?: any;
}

export class P2PRoomManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private roomState: RoomState | null = null;
  private isHost: boolean = false;
  private localPlayerId: string = '';
  private timerInterval: any = null;

  // Event callbacks
  private onStateChangeCb: StateCallback | null = null;
  private onChatCb: ChatCallback | null = null;
  private onBottleSpinCb: BottleSpinCallback | null = null;
  private onActionChosenCb: ActionChosenCallback | null = null;
  private onLiveTypingCb: ((text: string) => void) | null = null;

  constructor() {
    let savedId = localStorage.getItem('td_my_player_id');
    if (!savedId) {
      savedId = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('td_my_player_id', savedId);
    }
    this.localPlayerId = savedId;
  }

  public getLocalPlayerId(): string {
    return this.localPlayerId;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getPeerIdForRoom(roomCode: string): string {
    return `td-room-${roomCode.toUpperCase().trim()}`;
  }

  public subscribe(
    onState: StateCallback,
    onChat: ChatCallback,
    onSpin: BottleSpinCallback,
    onAction: ActionChosenCallback,
    onLiveTyping?: (text: string) => void
  ) {
    this.onStateChangeCb = onState;
    this.onChatCb = onChat;
    this.onBottleSpinCb = onSpin;
    this.onActionChosenCb = onAction;
    if (onLiveTyping) this.onLiveTypingCb = onLiveTyping;
  }

  // HOST: Create Room
  public async createRoom(
    name: string,
    avatar: string,
    settings?: Partial<GameSettings>
  ): Promise<{ success: boolean; code?: string; state?: RoomState; error?: string }> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.isHost = true;
    localStorage.setItem('td_is_host', 'true');
    localStorage.setItem('td_my_player_id', this.localPlayerId);

    const hostPlayer: Player = {
      id: this.localPlayerId,
      token: 'tok_' + Math.random().toString(36).substring(2, 9),
      name: name.trim() || 'Player 1',
      avatar: avatar || '😎',
      isHost: true,
      isReady: true,
      score: 0,
      streak: 0,
      highestStreak: 0,
      skipsRemaining: 3,
      truthsCompleted: 0,
      daresCompleted: 0,
      skipsUsed: 0,
      isConnected: true,
    };

    const initialSettings: GameSettings = {
      mode: 'Classic',
      difficulty: 'All',
      timerDuration: 60,
      maxSkips: 3,
      maxRounds: 10,
      categories: [],
      ...settings,
    };

    this.roomState = {
      code,
      createdAt: Date.now(),
      settings: initialSettings,
      phase: 'LOBBY',
      players: [hostPlayer],
      currentTurnPlayerId: null,
      currentRound: 1,
      activeChoice: null,
      activeQuestion: null,
      timerRemaining: null,
      timerTotal: null,
      usedQuestionIds: [],
      customQuestions: [],
      chatMessages: [],
    };

    const peerId = this.getPeerIdForRoom(code);

    const peerConfig = {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    };

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(peerId, peerConfig);

        this.peer.on('open', (id) => {
          console.log('[P2P] Host peer opened with ID:', id);
          if (this.onStateChangeCb && this.roomState) {
            this.onStateChangeCb({ ...this.roomState });
          }
          resolve({ success: true, code, state: this.roomState! });
        });

        this.peer.on('connection', (conn) => {
          console.log('[P2P] Incoming guest connection');
          this.connection = conn;
          this.setupConnectionHandlers(conn);
        });

        this.peer.on('error', (err: any) => {
          console.error('[P2P] Peer error:', err);
          if (err.type === 'unavailable-id') {
            this.createRoom(name, avatar, settings).then(resolve);
          } else {
            resolve({ success: false, error: err.message || 'P2P Connection Error' });
          }
        });
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  // GUEST: Join Room
  public async joinRoom(
    code: string,
    name: string,
    avatar: string
  ): Promise<{ success: boolean; state?: RoomState; error?: string }> {
    const cleanCode = code.toUpperCase().trim();
    this.isHost = false;
    localStorage.setItem('td_is_host', 'false');
    localStorage.setItem('td_my_player_id', this.localPlayerId);
    const targetPeerId = this.getPeerIdForRoom(cleanCode);

    const peerConfig = {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    };

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(peerConfig);

        this.peer.on('open', () => {
          console.log('[P2P] Guest peer opened, connecting to host:', targetPeerId);
          const conn = this.peer!.connect(targetPeerId, {
            reliable: true,
          });

          this.connection = conn;

          conn.on('open', () => {
            console.log('[P2P] Connected to host DataChannel!');
            const guestPlayer: Partial<Player> = {
              id: this.localPlayerId,
              name: name.trim() || 'Player 2',
              avatar: avatar || '🥳',
            };
            conn.send({
              type: 'JOIN_REQUEST',
              payload: { player: guestPlayer, code: cleanCode },
            });
          });

          conn.on('data', (data: any) => {
            this.handleIncomingData(data, resolve);
          });

          conn.on('close', () => {
            console.log('[P2P] Connection closed');
          });

          conn.on('error', (err) => {
            console.error('[P2P] Connection error:', err);
            resolve({ success: false, error: 'Could not connect to room. Please check the code.' });
          });
        });

        this.peer.on('error', (err: any) => {
          console.error('[P2P] Guest Peer error:', err);
          resolve({ success: false, error: 'Room not found or host offline.' });
        });
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('open', () => {
      console.log('[P2P Host] Guest connection opened');
    });

    conn.on('data', (data: any) => {
      this.handleIncomingData(data);
    });

    conn.on('close', () => {
      console.log('[P2P Host] Guest disconnected');
      if (this.roomState) {
        this.roomState.players = this.roomState.players.filter(p => p.id === this.localPlayerId);
        this.broadcastState();
      }
    });
  }

  private handleIncomingData(msg: P2PMessage, joinResolve?: (val: any) => void) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'JOIN_REQUEST': {
        if (this.isHost && this.roomState) {
          const guest = msg.payload.player;
          const newPlayer: Player = {
            id: guest.id,
            token: 'tok_' + Math.random().toString(36).substring(2, 9),
            name: guest.name,
            avatar: guest.avatar,
            isHost: false,
            isReady: false,
            score: 0,
            streak: 0,
            highestStreak: 0,
            skipsRemaining: this.roomState.settings.maxSkips === -1 ? 999 : this.roomState.settings.maxSkips,
            truthsCompleted: 0,
            daresCompleted: 0,
            skipsUsed: 0,
            isConnected: true,
          };

          this.roomState.players = [this.roomState.players[0], newPlayer];
          this.broadcast({
            type: 'JOIN_RESPONSE',
            payload: { success: true, state: this.roomState },
          });
          this.broadcastState();
        }
        break;
      }

      case 'JOIN_RESPONSE': {
        if (msg.payload.success && msg.payload.state) {
          this.roomState = msg.payload.state;
          if (this.onStateChangeCb && this.roomState) this.onStateChangeCb({ ...this.roomState });
          if (joinResolve) joinResolve({ success: true, state: this.roomState });
        } else {
          if (joinResolve) joinResolve({ success: false, error: msg.payload.error || 'Failed to join' });
        }
        break;
      }

      case 'SYNC_STATE': {
        this.roomState = msg.payload;
        if (this.onStateChangeCb && this.roomState) {
          this.onStateChangeCb({ ...this.roomState });
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        if (this.roomState) {
          this.roomState.chatMessages = [...(this.roomState.chatMessages || []), msg.payload];
        }
        if (this.onChatCb) this.onChatCb(msg.payload);
        if (this.isHost) {
          this.broadcastState();
        }
        break;
      }

      case 'BOTTLE_SPIN': {
        if (this.onBottleSpinCb) this.onBottleSpinCb(msg.payload);
        break;
      }

      case 'ACTION_CHOSEN': {
        if (this.onActionChosenCb) this.onActionChosenCb(msg.payload);
        break;
      }

      case 'LIVE_TYPING': {
        if (this.roomState) {
          this.roomState.liveTypedAnswer = msg.payload;
        }
        if (this.onLiveTypingCb) this.onLiveTypingCb(msg.payload);
        break;
      }

      case 'ACTION_EVENT': {
        if (this.isHost) {
          this.handleHostAction(msg.payload.action, msg.payload.data);
        }
        break;
      }
    }
  }

  private broadcast(msg: P2PMessage) {
    if (this.connection && this.connection.open) {
      this.connection.send(msg);
    }
  }

  private broadcastState() {
    if (this.roomState) {
      if (this.onStateChangeCb) this.onStateChangeCb({ ...this.roomState });
      this.broadcast({
        type: 'SYNC_STATE',
        payload: this.roomState,
      });
    }
  }

  private sendToHost(action: string, data?: any) {
    this.broadcast({
      type: 'ACTION_EVENT',
      payload: { action, data },
    });
  }

  private handleHostAction(action: string, data: any) {
    if (!this.isHost || !this.roomState) return;

    switch (action) {
      case 'toggleReady': {
        const player = this.roomState.players.find(p => p.id === data.playerId);
        if (player) {
          player.isReady = !player.isReady;
          this.broadcastState();
        }
        break;
      }

      case 'updateSettings': {
        this.roomState.settings = { ...this.roomState.settings, ...data.settings };
        this.broadcastState();
        break;
      }

      case 'startGame': {
        if (this.roomState.players.length >= 1) {
          this.roomState.phase = 'CHOOSING';
          this.roomState.currentRound = 1;
          const chosen = this.roomState.players[Math.floor(Math.random() * this.roomState.players.length)];
          this.roomState.currentTurnPlayerId = chosen.id;
          this.roomState.activeChoice = null;
          this.roomState.activeQuestion = null;
          this.roomState.liveTypedAnswer = '';
          
          const rotation = 1440 + Math.floor(Math.random() * 360);
          this.broadcast({
            type: 'BOTTLE_SPIN',
            payload: { selectedPlayerId: chosen.id, selectedPlayerName: chosen.name, rotation },
          });
          if (this.onBottleSpinCb) {
            this.onBottleSpinCb({ selectedPlayerId: chosen.id, selectedPlayerName: chosen.name, rotation });
          }

          this.broadcastState();
        }
        break;
      }

      case 'chooseAction': {
        const choice = data.choice as 'truth' | 'dare';
        const question = data.question || localQuestionEngine.getRandomQuestion(
          choice,
          this.roomState.settings,
          this.roomState.usedQuestionIds,
          this.roomState.customQuestions
        );

        this.roomState.activeChoice = choice;
        this.roomState.activeQuestion = question;
        if (!this.roomState.usedQuestionIds.includes(question.id)) {
          this.roomState.usedQuestionIds.push(question.id);
        }
        this.roomState.phase = 'ANSWERING';
        this.roomState.liveTypedAnswer = '';

        const timerDur = this.roomState.settings.timerDuration;
        if (timerDur > 0) {
          this.roomState.timerTotal = timerDur;
          this.roomState.timerRemaining = timerDur;
          this.startTimer(timerDur);
        }

        const currPlayer = this.roomState.players.find(p => p.id === this.roomState!.currentTurnPlayerId);
        if (currPlayer) {
          this.broadcast({
            type: 'ACTION_CHOSEN',
            payload: { choice, question, player: currPlayer },
          });
          if (this.onActionChosenCb) {
            this.onActionChosenCb({ choice, question, player: currPlayer });
          }
        }

        this.broadcastState();
        break;
      }

      case 'submitAnswer': {
        clearInterval(this.timerInterval);
        const currPlayer = this.roomState.players.find(p => p.id === this.roomState!.currentTurnPlayerId);
        if (currPlayer) {
          if (this.roomState.activeChoice === 'truth') {
            currPlayer.truthsCompleted += 1;
            currPlayer.score += 10;
          } else {
            currPlayer.daresCompleted += 1;
            currPlayer.score += 15;
          }
          currPlayer.streak += 1;
          if (currPlayer.streak > currPlayer.highestStreak) {
            currPlayer.highestStreak = currPlayer.streak;
          }
        }

        const answerText = data.answerText || this.roomState.liveTypedAnswer || 'Completed! 🎉';
        const chatMsg: ChatMessage = {
          id: 'ans_' + Date.now(),
          senderId: currPlayer?.id || 'sys',
          senderName: currPlayer?.name || 'Player',
          avatar: currPlayer?.avatar || '🌟',
          type: 'answer',
          text: answerText,
          questionContext: {
            questionText: this.roomState.activeQuestion?.text || '',
            choice: this.roomState.activeChoice || 'truth',
            points: this.roomState.activeChoice === 'dare' ? 15 : 10,
          },
          timestamp: Date.now(),
        };

        this.roomState.chatMessages = [...(this.roomState.chatMessages || []), chatMsg];
        this.broadcast({
          type: 'CHAT_MESSAGE',
          payload: chatMsg,
        });
        if (this.onChatCb) this.onChatCb(chatMsg);

        this.advanceTurn();
        break;
      }

      case 'skipQuestion': {
        const currPlayer = this.roomState.players.find(p => p.id === this.roomState!.currentTurnPlayerId);
        if (currPlayer && currPlayer.skipsRemaining > 0) {
          currPlayer.skipsRemaining -= 1;
          currPlayer.skipsUsed += 1;
          currPlayer.streak = 0;
        }
        clearInterval(this.timerInterval);
        this.advanceTurn();
        break;
      }

      case 'addCustomQuestion': {
        const q: Question = {
          id: 'custom_' + Date.now(),
          type: data.type,
          category: 'Custom',
          difficulty: 'Normal',
          text: data.text,
          isCustom: true,
          authorName: data.authorName,
        };
        this.roomState.customQuestions.push(q);
        this.broadcastState();
        break;
      }

      case 'restartGame': {
        this.roomState.phase = 'CHOOSING';
        this.roomState.currentRound = 1;
        this.roomState.players.forEach(p => {
          p.score = 0;
          p.streak = 0;
          p.truthsCompleted = 0;
          p.daresCompleted = 0;
          p.skipsRemaining = this.roomState!.settings.maxSkips === -1 ? 999 : this.roomState!.settings.maxSkips;
        });
        this.roomState.usedQuestionIds = [];
        this.advanceTurn();
        break;
      }
    }
  }

  private advanceTurn() {
    if (!this.roomState) return;
    const nextRound = this.roomState.currentRound + 1;
    if (this.roomState.settings.maxRounds > 0 && nextRound > this.roomState.settings.maxRounds) {
      this.roomState.phase = 'RESULTS';
      this.broadcastState();
      return;
    }

    this.roomState.currentRound = nextRound;
    this.roomState.phase = 'CHOOSING';
    this.roomState.activeChoice = null;
    this.roomState.activeQuestion = null;
    this.roomState.liveTypedAnswer = '';

    const currentIndex = this.roomState.players.findIndex(p => p.id === this.roomState!.currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % this.roomState.players.length;
    const nextPlayer = this.roomState.players[nextIndex];
    this.roomState.currentTurnPlayerId = nextPlayer.id;

    const rotation = 1440 + Math.floor(Math.random() * 360);
    this.broadcast({
      type: 'BOTTLE_SPIN',
      payload: { selectedPlayerId: nextPlayer.id, selectedPlayerName: nextPlayer.name, rotation },
    });
    if (this.onBottleSpinCb) {
      this.onBottleSpinCb({ selectedPlayerId: nextPlayer.id, selectedPlayerName: nextPlayer.name, rotation });
    }

    this.broadcastState();
  }

  private startTimer(seconds: number) {
    clearInterval(this.timerInterval);
    let rem = seconds;
    this.timerInterval = setInterval(() => {
      rem -= 1;
      if (this.roomState) {
        this.roomState.timerRemaining = rem;
        this.broadcastState();
      }
      if (rem <= 0) {
        clearInterval(this.timerInterval);
        this.handleHostAction('skipQuestion', {});
      }
    }, 1000);
  }

  public toggleReady() {
    if (this.isHost) {
      this.handleHostAction('toggleReady', { playerId: this.localPlayerId });
    } else {
      this.sendToHost('toggleReady', { playerId: this.localPlayerId });
    }
  }

  public updateSettings(settings: Partial<GameSettings>) {
    if (this.isHost) {
      this.handleHostAction('updateSettings', { settings });
    } else {
      this.sendToHost('updateSettings', { settings });
    }
  }

  public startGame() {
    if (this.isHost) {
      this.handleHostAction('startGame', {});
    }
  }

  public chooseAction(choice: 'truth' | 'dare') {
    const question = localQuestionEngine.getRandomQuestion(
      choice,
      this.roomState?.settings || {
        mode: 'Classic',
        difficulty: 'All',
        timerDuration: 30,
        maxSkips: 3,
        maxRounds: 10,
        categories: [],
      },
      this.roomState?.usedQuestionIds || [],
      this.roomState?.customQuestions || []
    );

    if (this.roomState) {
      this.roomState.activeChoice = choice;
      this.roomState.activeQuestion = question;
      this.roomState.phase = 'ANSWERING';
      this.roomState.liveTypedAnswer = '';
      if (!this.roomState.usedQuestionIds.includes(question.id)) {
        this.roomState.usedQuestionIds.push(question.id);
      }
      const timerDur = this.roomState.settings.timerDuration;
      if (timerDur > 0) {
        this.roomState.timerTotal = timerDur;
        this.roomState.timerRemaining = timerDur;
      }
      if (this.onStateChangeCb) {
        this.onStateChangeCb({ ...this.roomState });
      }
    }

    if (this.isHost) {
      this.handleHostAction('chooseAction', { choice, question });
    } else {
      this.sendToHost('chooseAction', { choice, question });
    }
  }

  public submitAnswer(answerText?: string) {
    if (this.isHost) {
      this.handleHostAction('submitAnswer', { answerText });
    } else {
      this.sendToHost('submitAnswer', { answerText });
    }
  }

  public liveTyping(text: string) {
    this.broadcast({
      type: 'LIVE_TYPING',
      payload: text,
    });
  }

  public skipQuestion() {
    if (this.isHost) {
      this.handleHostAction('skipQuestion', {});
    } else {
      this.sendToHost('skipQuestion', {});
    }
  }

  public addCustomQuestion(text: string, type: 'truth' | 'dare', authorName?: string) {
    if (this.isHost) {
      this.handleHostAction('addCustomQuestion', { text, type, authorName });
    } else {
      this.sendToHost('addCustomQuestion', { text, type, authorName });
    }
  }

  public restartGame() {
    if (this.isHost) {
      this.handleHostAction('restartGame', {});
    } else {
      this.sendToHost('restartGame', {});
    }
  }

  public sendChatMessage(msg: Partial<ChatMessage>) {
    const fullMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      senderId: this.localPlayerId,
      senderName: msg.senderName || 'Player',
      avatar: msg.avatar || '💬',
      type: msg.type || 'text',
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      mediaDuration: msg.mediaDuration,
      replyTo: msg.replyTo,
      timestamp: Date.now(),
    };

    if (this.roomState) {
      this.roomState.chatMessages = [...(this.roomState.chatMessages || []), fullMsg];
    }
    this.broadcast({
      type: 'CHAT_MESSAGE',
      payload: fullMsg,
    });
    if (this.onChatCb) this.onChatCb(fullMsg);
    if (this.isHost) this.broadcastState();
  }

  public leaveRoom() {
    clearInterval(this.timerInterval);
    if (this.connection) {
      this.connection.close();
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.roomState = null;
  }
}

export const p2pRoomManager = new P2PRoomManager();
