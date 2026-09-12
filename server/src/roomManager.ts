import crypto from 'crypto';
import { Server } from 'socket.io';
import { 
  RoomState, Player, GameSettings, Question, GamePhase, 
  ServerToClientEvents, ClientToServerEvents, Difficulty, ChatMessage 
} from './types.js';
import { QuestionEngine } from './questionEngine.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

function generateToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private questionEngine: QuestionEngine;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>, questionEngine: QuestionEngine) {
    this.io = io;
    this.questionEngine = questionEngine;
  }

  public getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public findRoomBySocketId(socketId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public createRoom(
    socketId: string, 
    hostName: string, 
    hostAvatar: string, 
    settingsPartial: Partial<GameSettings> = {}
  ): { code: string; token: string; room: RoomState } {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const defaultSettings: GameSettings = {
      mode: 'Classic',
      difficulty: 'All',
      timerDuration: 30,
      maxSkips: 3,
      maxRounds: 10,
      categories: [
        'Flirty & Crush', 'Romantic & Cute', 'Funny & Teasing', 'Secrets & Confessions',
        'First Impressions', 'Would You Rather', 'Deep Feelings', 'Friendship Vibes',
        'Flirty & Sweet', 'Camera & Cute Poses', 'Voice & Singing', 'Playful & Teasing',
        'Eye Contact & Smiles', 'Acting & Romantic', 'Compliments', 'Quick Challenges'
      ]
    };

    const settings: GameSettings = { ...defaultSettings, ...settingsPartial };
    const token = generateToken();

    const hostPlayer: Player = {
      id: socketId,
      token,
      name: hostName.trim().slice(0, 24) || 'Player 1',
      avatar: hostAvatar || '🧑',
      isHost: true,
      isReady: true,
      score: 0,
      streak: 0,
      highestStreak: 0,
      skipsRemaining: settings.maxSkips === -1 ? 999 : settings.maxSkips,
      truthsCompleted: 0,
      daresCompleted: 0,
      skipsUsed: 0,
      isConnected: true
    };

    const room: RoomState = {
      code,
      createdAt: Date.now(),
      settings,
      phase: 'LOBBY',
      players: [hostPlayer],
      currentTurnPlayerId: socketId,
      currentRound: 1,
      activeChoice: null,
      activeQuestion: null,
      timerRemaining: null,
      timerTotal: null,
      usedQuestionIds: [],
      customQuestions: [],
      liveTypedAnswer: '',
      lastAnswer: null,
      chatMessages: []
    };

    this.rooms.set(code, room);
    console.log(`[RoomManager] Room created: ${code} by ${hostName}`);
    return { code, token, room };
  }

  public joinRoom(
    code: string, 
    socketId: string, 
    playerName: string, 
    playerAvatar: string,
    existingToken?: string
  ): { success: boolean; token?: string; room?: RoomState; error?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { success: false, error: 'Room not found. Please check your room code.' };
    }

    // Check if player is explicitly reconnecting without filling join form
    if (existingToken && !playerName) {
      const existingPlayer = room.players.find(p => p.token === existingToken);
      if (existingPlayer) {
        existingPlayer.id = socketId;
        existingPlayer.isConnected = true;
        existingPlayer.disconnectedAt = undefined;

        const dcKey = `${code}_${existingToken}`;
        if (this.disconnectTimeouts.has(dcKey)) {
          clearTimeout(this.disconnectTimeouts.get(dcKey)!);
          this.disconnectTimeouts.delete(dcKey);
        }

        console.log(`[RoomManager] Player ${existingPlayer.name} reconnected to ${code}`);
        this.broadcastRoom(code);
        this.io.to(code).emit('playerReconnectedNotice', { playerName: existingPlayer.name });
      }
    }

    // Check room capacity (max 2 players)
    if (room.players.length >= 2) {
      return { success: false, error: 'Room is already full (Maximum 2 players allowed).' };
    }

    const token = generateToken();
    const newPlayer: Player = {
      id: socketId,
      token,
      name: playerName.trim().slice(0, 24) || 'Player 2',
      avatar: playerAvatar || '👩',
      isHost: false,
      isReady: true,
      score: 0,
      streak: 0,
      highestStreak: 0,
      skipsRemaining: room.settings.maxSkips === -1 ? 999 : room.settings.maxSkips,
      truthsCompleted: 0,
      daresCompleted: 0,
      skipsUsed: 0,
      isConnected: true
    };

    room.players.push(newPlayer);
    console.log(`[RoomManager] Player ${playerName} joined room ${code}`);
    this.broadcastRoom(code);
    return { success: true, token, room };
  }

  public updateSettings(code: string, socketId: string, partial: Partial<GameSettings>): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'LOBBY') return false;

    const host = room.players.find(p => p.id === socketId && p.isHost);
    if (!host) return false;

    room.settings = { ...room.settings, ...partial };
    // update skips for existing players if maxSkips changed
    if (partial.maxSkips !== undefined) {
      room.players.forEach(p => {
        p.skipsRemaining = room.settings.maxSkips === -1 ? 999 : room.settings.maxSkips;
      });
    }

    this.broadcastRoom(code);
    return true;
  }

  public addCustomQuestion(
    code: string, 
    socketId: string, 
    data: { type: 'truth' | 'dare'; category: string; difficulty: Difficulty; text: string }
  ): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    const sanitizedText = data.text.trim().slice(0, 200);
    if (sanitizedText.length < 5) return false;

    const newCustom: Question = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: data.type,
      category: data.category || 'Random',
      difficulty: data.difficulty || 'Normal',
      text: sanitizedText,
      isCustom: true,
      authorName: player.name
    };

    room.customQuestions.push(newCustom);
    this.broadcastRoom(code);
    return true;
  }

  public toggleReady(code: string, socketId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'LOBBY') return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    player.isReady = !player.isReady;
    this.broadcastRoom(code);
    return true;
  }

  public startGame(code: string, socketId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'LOBBY') return false;

    if (room.players.length < 2) {
      this.io.to(socketId).emit('errorNotice', 'Cannot start game without a friend in the room.');
      return false;
    }

    // Reset scores & game state for clean launch
    room.phase = 'CHOOSING';
    room.currentRound = 1;
    room.currentTurnPlayerId = room.players[0].id; // Host starts
    room.activeChoice = null;
    room.activeQuestion = null;
    room.timerRemaining = null;
    room.timerTotal = null;
    room.usedQuestionIds = [];

    // Handle mode lock if Truth Only or Dare Only
    if (room.settings.mode === 'Truth Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'truth');
      return true;
    } else if (room.settings.mode === 'Dare Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'dare');
      return true;
    }

    console.log(`[RoomManager] Game started in room ${code}`);
    this.io.to(code).emit('gameStarted', room);
    this.broadcastRoom(code);
    return true;
  }

  public chooseType(code: string, socketId: string, choice: 'truth' | 'dare'): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'CHOOSING') return false;

    if (room.currentTurnPlayerId !== socketId) {
      return false; // Not this player's turn
    }

    room.activeChoice = choice;
    room.liveTypedAnswer = '';
    const question = this.questionEngine.getRandomQuestion(
      choice, 
      room.settings, 
      room.usedQuestionIds, 
      room.customQuestions
    );

    room.activeQuestion = question;
    room.usedQuestionIds.push(question.id);
    room.phase = 'ANSWERING';

    // Start timer if configured
    this.clearTimer(code);
    if (room.settings.timerDuration > 0) {
      room.timerTotal = room.settings.timerDuration;
      room.timerRemaining = room.settings.timerDuration;
      this.startRoomTimer(code);
    } else {
      room.timerTotal = null;
      room.timerRemaining = null;
    }

    console.log(`[RoomManager] Question chosen in ${code}: [${choice}] ${question.text.slice(0, 40)}...`);
    this.broadcastRoom(code);
    return true;
  }

  public handleTypeAnswer(code: string, socketId: string, text: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'ANSWERING') return;
    if (room.currentTurnPlayerId !== socketId) return;

    room.liveTypedAnswer = (text || '').slice(0, 500);
    this.io.to(code).emit('liveAnswerUpdated', { playerId: socketId, text: room.liveTypedAnswer });
  }

  public completeQuestion(
    code: string, 
    socketId: string, 
    payload?: { answerText?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | 'voice'; mediaDuration?: number } | string
  ): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'ANSWERING') return false;

    if (room.currentTurnPlayerId !== socketId) return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    this.clearTimer(code);

    let answerText = '';
    let mediaUrl: string | undefined = undefined;
    let mediaType: 'image' | 'video' | 'voice' | undefined = undefined;
    let mediaDuration: number | undefined = undefined;

    if (typeof payload === 'string') {
      answerText = payload;
    } else if (payload) {
      answerText = payload.answerText || '';
      mediaUrl = payload.mediaUrl;
      mediaType = payload.mediaType;
      mediaDuration = payload.mediaDuration;
    }

    const finalAnswer = (answerText || room.liveTypedAnswer || '').trim();
    if (finalAnswer || mediaUrl) {
      room.lastAnswer = {
        playerId: player.id,
        playerName: player.name,
        choice: room.activeChoice || 'truth',
        questionText: room.activeQuestion?.text || '',
        answerText: finalAnswer || (mediaType ? `[Sent a ${mediaType}]` : 'Completed!'),
        timestamp: Date.now()
      };

      // Add as rich answer card in chat stream
      const answerMsg: ChatMessage = {
        id: `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        senderId: player.id,
        senderName: player.name,
        avatar: player.avatar,
        type: mediaType ? (mediaType as any) : 'answer',
        text: finalAnswer,
        mediaUrl: mediaUrl,
        mediaDuration: mediaDuration,
        questionContext: {
          questionText: room.activeQuestion?.text || '',
          choice: room.activeChoice || 'truth',
          points: room.activeChoice === 'truth' ? 10 : 15
        },
        timestamp: Date.now()
      };

      if (!room.chatMessages) room.chatMessages = [];
      room.chatMessages.push(answerMsg);
      if (room.chatMessages.length > 60) room.chatMessages.shift();
      this.io.to(code).emit('newChatMessage', answerMsg);
    } else {
      room.lastAnswer = null;
    }
    room.liveTypedAnswer = '';

    // Calculate score
    let basePoints = room.activeChoice === 'truth' ? 10 : 15;
    if (room.activeQuestion?.difficulty === 'Challenge') {
      basePoints += 5; // +20 total for challenge
    }

    // Streak bonus calculation
    player.streak += 1;
    if (player.streak > player.highestStreak) {
      player.highestStreak = player.streak;
    }

    let streakBonus = 0;
    if (player.streak === 3) streakBonus = 10;
    else if (player.streak === 5) streakBonus = 20;
    else if (player.streak >= 10 && player.streak % 5 === 0) streakBonus = 50;

    const totalPointsEarned = basePoints + streakBonus;
    player.score += totalPointsEarned;

    if (room.activeChoice === 'truth') player.truthsCompleted += 1;
    else player.daresCompleted += 1;

    // Emit celebration event
    this.io.to(code).emit('scoreGained', {
      playerId: player.id,
      points: totalPointsEarned,
      streak: player.streak,
      reason: streakBonus > 0 ? `+${streakBonus} STREAK BONUS!` : (finalAnswer ? 'Answered!' : 'Completed!')
    });

    // Advance turn and round
    this.advanceTurn(code);
    return true;
  }

  public skipQuestion(code: string, socketId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.phase !== 'ANSWERING') return false;

    if (room.currentTurnPlayerId !== socketId) return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    if (room.settings.maxSkips !== -1 && player.skipsRemaining <= 0) {
      this.io.to(socketId).emit('errorNotice', 'No skips remaining!');
      return false;
    }

    if (room.settings.maxSkips !== -1) {
      player.skipsRemaining -= 1;
    }
    player.skipsUsed += 1;
    player.streak = 0; // Reset streak on skip
    room.liveTypedAnswer = '';

    // Generate fresh replacement question
    const choice = room.activeChoice || 'truth';
    const newQuestion = this.questionEngine.getRandomQuestion(
      choice, 
      room.settings, 
      room.usedQuestionIds, 
      room.customQuestions
    );

    room.activeQuestion = newQuestion;
    room.usedQuestionIds.push(newQuestion.id);

    // Reset timer for new question
    this.clearTimer(code);
    if (room.settings.timerDuration > 0) {
      room.timerRemaining = room.settings.timerDuration;
      this.startRoomTimer(code);
    }

    this.broadcastRoom(code);
    return true;
  }

  public sendChatMessage(
    code: string, 
    socketId: string, 
    payload: {
      text?: string;
      type?: 'text' | 'image' | 'video' | 'voice';
      mediaUrl?: string;
      mediaDuration?: number;
      replyTo?: { id: string; senderName: string; text: string };
    } | string
  ): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return false;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return false;

    let text = '';
    let type: 'text' | 'image' | 'video' | 'voice' = 'text';
    let mediaUrl: string | undefined = undefined;
    let mediaDuration: number | undefined = undefined;
    let replyTo: { id: string; senderName: string; text: string } | undefined = undefined;

    if (typeof payload === 'string') {
      text = payload.trim().slice(0, 500);
    } else if (payload) {
      text = (payload.text || '').trim().slice(0, 500);
      type = payload.type || 'text';
      mediaUrl = payload.mediaUrl;
      mediaDuration = payload.mediaDuration;
      replyTo = payload.replyTo;
    }

    if (!text && !mediaUrl) return false;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: player.id,
      senderName: player.name,
      avatar: player.avatar,
      type,
      text: text || undefined,
      mediaUrl,
      mediaDuration,
      replyTo,
      timestamp: Date.now()
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(msg);
    if (room.chatMessages.length > 60) {
      room.chatMessages.shift();
    }

    this.io.to(code).emit('newChatMessage', msg);
    this.broadcastRoom(code);
    return true;
  }

  private advanceTurn(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;

    // Find next player
    const currentPlayerIndex = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;

    // If we've completed a cycle back to player 0, increment round
    if (nextPlayerIndex === 0) {
      room.currentRound += 1;
    }

    // Check if game is complete (reached maxRounds)
    if (room.currentRound > room.settings.maxRounds) {
      this.endGame(code);
      return;
    }

    room.currentTurnPlayerId = room.players[nextPlayerIndex].id;
    room.activeChoice = null;
    room.activeQuestion = null;
    room.phase = 'CHOOSING';

    // Auto-advance if Truth Only or Dare Only mode
    if (room.settings.mode === 'Truth Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'truth');
      return;
    } else if (room.settings.mode === 'Dare Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'dare');
      return;
    }

    this.broadcastRoom(code);
  }

  private endGame(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;

    this.clearTimer(code);
    room.phase = 'RESULTS';

    const p1 = room.players[0];
    const p2 = room.players[1] || room.players[0];

    let winnerPlayerId = '';
    let winnerPlayerName = '';
    let isTie = false;

    if (p1.score > p2.score) {
      winnerPlayerId = p1.id;
      winnerPlayerName = p1.name;
    } else if (p2.score > p1.score) {
      winnerPlayerId = p2.id;
      winnerPlayerName = p2.name;
    } else {
      isTie = true;
      winnerPlayerName = 'It\'s a Tie!';
    }

    room.winner = {
      playerId: winnerPlayerId,
      playerName: winnerPlayerName,
      isTie,
      player1Score: p1.score,
      player2Score: p2.score
    };

    console.log(`[RoomManager] Game ended in ${code}. Winner: ${winnerPlayerName}`);
    this.io.to(code).emit('gameEnded', room);
    this.broadcastRoom(code);
  }

  public playAgain(code: string, socketId: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return false;

    // Reset scores & game variables
    room.phase = 'CHOOSING';
    room.currentRound = 1;
    room.currentTurnPlayerId = room.players[0].id;
    room.activeChoice = null;
    room.activeQuestion = null;
    room.timerRemaining = null;
    room.timerTotal = null;
    room.usedQuestionIds = [];
    room.winner = undefined;

    room.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.highestStreak = 0;
      p.skipsRemaining = room.settings.maxSkips === -1 ? 999 : room.settings.maxSkips;
      p.truthsCompleted = 0;
      p.daresCompleted = 0;
      p.skipsUsed = 0;
    });

    if (room.settings.mode === 'Truth Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'truth');
    } else if (room.settings.mode === 'Dare Only') {
      this.chooseType(code, room.currentTurnPlayerId, 'dare');
    }

    this.broadcastRoom(code);
    return true;
  }

  public resetToLobby(code: string): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return false;

    this.clearTimer(code);
    room.phase = 'LOBBY';
    room.currentRound = 1;
    room.activeChoice = null;
    room.activeQuestion = null;
    room.winner = undefined;

    room.players.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.highestStreak = 0;
      p.skipsRemaining = room.settings.maxSkips === -1 ? 999 : room.settings.maxSkips;
      p.truthsCompleted = 0;
      p.daresCompleted = 0;
      p.skipsUsed = 0;
      p.isReady = true;
    });

    this.broadcastRoom(code);
    return true;
  }

  private startRoomTimer(code: string) {
    this.clearTimer(code);
    const interval = setInterval(() => {
      const room = this.rooms.get(code.toUpperCase());
      if (!room || room.phase !== 'ANSWERING' || room.timerRemaining === null) {
        this.clearTimer(code);
        return;
      }

      room.timerRemaining -= 1;
      this.io.to(code).emit('timerTick', room.timerRemaining);

      if (room.timerRemaining <= 0) {
        this.clearTimer(code);
        this.io.to(code).emit('timeUp');
      }
    }, 1000);

    this.timers.set(code.toUpperCase(), interval);
  }

  private clearTimer(code: string) {
    const upper = code.toUpperCase();
    if (this.timers.has(upper)) {
      clearInterval(this.timers.get(upper)!);
      this.timers.delete(upper);
    }
  }

  public handleDisconnect(socketId: string) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        player.isConnected = false;
        player.disconnectedAt = Date.now();
        console.log(`[RoomManager] Player ${player.name} in room ${code} disconnected.`);

        this.io.to(code).emit('playerDisconnectedNotice', {
          playerName: player.name,
          gracePeriodSeconds: 60
        });
        this.broadcastRoom(code);

        // Set 60-second cleanup timeout
        const dcKey = `${code}_${player.token}`;
        const timeout = setTimeout(() => {
          this.disconnectTimeouts.delete(dcKey);
          const currentRoom = this.rooms.get(code);
          if (!currentRoom) return;

          // If still disconnected after grace period, remove player or clean room
          const pIndex = currentRoom.players.findIndex(p => p.token === player.token && !p.isConnected);
          if (pIndex !== -1) {
            currentRoom.players.splice(pIndex, 1);
            if (currentRoom.players.length === 0) {
              this.clearTimer(code);
              this.rooms.delete(code);
              console.log(`[RoomManager] Room ${code} expired and removed.`);
            } else {
              // Remaining player becomes host if needed
              currentRoom.players[0].isHost = true;
              this.broadcastRoom(code);
            }
          }
        }, 60000);

        this.disconnectTimeouts.set(dcKey, timeout);
        break;
      }
    }
  }

  public sendReaction(code: string, socketId: string, emoji: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    this.io.to(code).emit('reactionReceived', {
      emoji,
      senderName: player.name,
      senderId: player.id
    });
  }

  public broadcastRoom(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      this.io.to(code.toUpperCase()).emit('roomUpdated', room);
    }
  }
}
