export type GameState = 'IDLE' | 'WAITING' | 'NOW' | 'RESULT' | 'TOO_EARLY' | 'INCORRECT_KEY';

export type GameMode = 'VISUAL' | 'AUDIO' | 'COLOR';

export interface ReactionAttempt {
  id: string;
  time: number; // in milliseconds
  timestamp: number;
  mode: GameMode;
  state: 'SUCCESS' | 'TOO_EARLY' | 'INCORRECT_KEY';
  targetColorName?: string; // For COLOR mode
  pressedKey?: string; // For COLOR mode
}

export interface GameStats {
  bestVisual: number | null;
  bestAudio: number | null;
  bestColor: number | null;
  attempts: ReactionAttempt[];
}
