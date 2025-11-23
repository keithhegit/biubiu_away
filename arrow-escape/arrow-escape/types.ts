export interface Point {
  r: number; // Row
  c: number; // Column
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Arrow {
  id: string;
  segments: Point[]; // Array of points occupying the grid. Index 0 is HEAD.
  direction: Direction; // The direction the head is pointing
  state: 'idle' | 'moving' | 'stuck';
  color: string;
  length: number;
}

export interface GameState {
  level: number;
  hp: number;
  maxHp: number;
  status: 'playing' | 'won' | 'lost' | 'transition';
  gridRows: number;
  gridCols: number;
  arrows: Arrow[];
  score: number;
  timeElapsed: number;
}

export const LEVELS_CONFIG = {
  totalLevels: 50,
  initialHp: 3,
};