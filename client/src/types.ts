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

export type SkipsOption = -1 | 3 | 5 | 10;

export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty | 'All';
  timerDuration: TimerOption;
  maxSkips: SkipsOption;
  maxRounds: number;
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
  id: string;
  token: string;
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
  | 'CHOOSING'
  | 'ANSWERING'
  | 'COMPLETED'
  | 'RESULTS';

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
  players: Player[];
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

