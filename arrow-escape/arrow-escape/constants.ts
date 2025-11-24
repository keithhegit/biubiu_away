import { Direction, Point } from './types';

export const DIRECTIONS = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];

export const DIR_OFFSETS: Record<Direction, Point> = {
  [Direction.UP]: { r: -1, c: 0 },
  [Direction.DOWN]: { r: 1, c: 0 },
  [Direction.LEFT]: { r: 0, c: -1 },
  [Direction.RIGHT]: { r: 0, c: 1 },
};

export const getOppositeDir = (dir: Direction): Direction => {
  switch (dir) {
    case Direction.UP: return Direction.DOWN;
    case Direction.DOWN: return Direction.UP;
    case Direction.LEFT: return Direction.RIGHT;
    case Direction.RIGHT: return Direction.LEFT;
  }
};

// "Technical Blueprint" Palette - Deep Navy, Indigo, Dark Blue
export const COLORS = [
  '#1a237e', // Indigo 900
  '#283593', // Indigo 800
  '#0d47a1', // Blue 900
  '#1565c0', // Blue 800
  '#311b92', // Deep Purple 900
  '#4527a0', // Deep Purple 800
  '#002171', // Custom Deep Navy
  '#001064', // Very Dark Blue
];