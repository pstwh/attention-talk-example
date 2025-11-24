export interface Token {
  id: string;
  text: string;
  index: number;
}

export interface AttentionWeight {
  sourceIndex: number;
  targetIndex: number;
  weight: number; // 0 to 1
}

export interface AttentionData {
  tokens: Token[];
  weights: AttentionWeight[];
  explanation?: string;
}

export enum GameMode {
  SELF_ATTENTION = 'SELF_ATTENTION',
  CROSS_ATTENTION = 'CROSS_ATTENTION',
  PLAYGROUND = 'PLAYGROUND'
}

export interface GameState {
  score: number;
  level: number;
  mode: GameMode;
}

export interface LevelConfig {
  id: number;
  instruction: string;
  sourceText: string;
  targetText?: string; // For cross attention
  targetTokenIndex?: number; // The token we are "attending" from
  correctAttentions: number[]; // Indices of tokens that should be attended to
}