export type GameMode = 
  | 'Classic'
  | 'Random'
  | 'Truth Only'
  | 'Dare Only'
  | 'Funny Friends'
  | 'Best Friends'
  | 'Getting to Know You'
  | 'Challenge Mode';

export type Difficulty = 'Easy' | 'Normal' | 'Funny' | 'Challenge';

export type TimerOption = 0 | 15 | 30 | 60 | 120;

export type SkipsOption = -1 | 3 | 5 | 10; // -1 for No Limit

export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty | 'All';
  timerDuration: TimerOption; // seconds
  maxSkips: SkipsOption;
  maxRounds: number; // default 10 or 15
  categories: string[];
}

export interface Question {
  id: string;
  type: 'truth' | 'dare';
  category: string;
  difficulty: Difficulty;
  text: string;
  isCustom?: boolean;
  authorName?: string;
}

export interface Player {
  id: string; // socket id
  token: string; // persistent session token for reconnect
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  streak: number;
  highestStreak: number;
  skipsRemaining: number;
  truthsCompleted: number;
  daresCompleted: number;
  skipsUsed: number;
  isConnected: boolean;
  disconnectedAt?: number;
}

export type GamePhase = 
  | 'LOBBY'
  | 'CHOOSING' // Waiting for active player to select Truth or Dare
  | 'ANSWERING' // Question displayed, timer running
  | 'COMPLETED' // Question answered or skipped, showing reaction/transition
  | 'RESULTS'; // Game over, showing podium & stats

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'answer';
  text?: string;
  mediaUrl?: string;
  mediaDuration?: number;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  questionContext?: {
    questionText: string;
    choice: 'truth' | 'dare';
    points: number;
  };
  timestamp: number;
}

export interface RoomState {
  code: string;
  createdAt: number;
  settings: GameSettings;
  phase: GamePhase;
  players: Player[]; // max 2
  currentTurnPlayerId: string | null;
  currentRound: number;
  activeChoice: 'truth' | 'dare' | null;
  activeQuestion: Question | null;
  timerRemaining: number | null;
  timerTotal: number | null;
  usedQuestionIds: string[];
  customQuestions: Question[];
  liveTypedAnswer?: string;
  lastAnswer?: {
    playerId: string;
    playerName: string;
    choice: 'truth' | 'dare';
    questionText: string;
    answerText: string;
    timestamp: number;
  } | null;
  chatMessages: ChatMessage[];
  lastActionMessage?: string;
  winner?: {
    playerId: string;
    playerName: string;
    isTie: boolean;
    player1Score: number;
    player2Score: number;
  };
}

export interface ServerToClientEvents {
  roomUpdated: (state: RoomState) => void;
  gameStarted: (state: RoomState) => void;
  timerTick: (remaining: number) => void;
  timeUp: () => void;
  scoreGained: (data: { playerId: string; points: number; streak: number; reason: string }) => void;
  reactionReceived: (data: { emoji: string; senderName: string; senderId: string }) => void;
  liveAnswerUpdated: (data: { playerId: string; text: string }) => void;
  newChatMessage: (data: ChatMessage) => void;
  playerDisconnectedNotice: (data: { playerName: string; gracePeriodSeconds: number }) => void;
  playerReconnectedNotice: (data: { playerName: string }) => void;
  gameEnded: (state: RoomState) => void;
  errorNotice: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (data: { name: string; avatar: string; settings: Partial<GameSettings> }, callback: (res: { success: boolean; code?: string; token?: string; state?: RoomState; error?: string }) => void) => void;
  joinRoom: (data: { code: string; name: string; avatar: string; token?: string }, callback: (res: { success: boolean; state?: RoomState; token?: string; error?: string }) => void) => void;
  reconnectSession: (data: { code: string; token: string }, callback: (res: { success: boolean; state?: RoomState; error?: string }) => void) => void;
  toggleReady: (data?: { code?: string }) => void;
  updateSettings: (data: Partial<GameSettings> & { code?: string }) => void;
  addCustomQuestion: (data: { type: 'truth' | 'dare'; category: string; difficulty: Difficulty; text: string; code?: string }) => void;
  startGame: (data?: { code?: string }) => void;
  chooseType: (data: { choice: 'truth' | 'dare'; code?: string } | 'truth' | 'dare') => void;
  typeAnswer: (data: { text: string; code?: string } | string) => void;
  completeQuestion: (data?: { answerText?: string; mediaUrl?: string; mediaType?: 'image' | 'video' | 'voice'; code?: string } | string) => void;
  skipQuestion: (data?: { code?: string }) => void;
  sendChatMessage: (data: {
    text?: string;
    type?: 'text' | 'image' | 'video' | 'voice';
    mediaUrl?: string;
    mediaDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
    code?: string;
  } | string) => void;
  sendReaction: (data: { emoji: string; code?: string } | string) => void;
  playAgain: (data?: { code?: string }) => void;
  resetToLobby: (data?: { code?: string }) => void;
}


