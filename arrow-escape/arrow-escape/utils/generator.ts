import { Arrow, Direction, Point } from '../types';
import { DIR_OFFSETS, getOppositeDir, DIRECTIONS, COLORS } from '../constants';

// Helper to check bounds
const isValidPos = (p: Point, rows: number, cols: number) => {
  return p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols;
};

// Helper to check if a point is occupied by any arrow in the Set
const isOccupied = (p: Point, occupied: Set<string>) => {
  return occupied.has(`${p.r},${p.c}`);
};

export const generateLevel = (level: number): { arrows: Arrow[], rows: number, cols: number } => {
  // Config
  let rows = 12;
  let cols = 9;
  let targetSnakes = 15;
  let minLen = 2;
  let maxLen = 5;
  let turnChance = 0.2;

  // Difficulty Tiers
  if (level === 1) {
    // Tutorial
    rows = 12; cols = 9; targetSnakes = 15;
  } else if (level <= 10) {
    // Standard (Level 2-10)
    rows = 24; cols = 14;
    // Scale snakes from 30 to 50
    targetSnakes = 30 + Math.floor((level - 2) * 2.5);
    maxLen = 12; turnChance = 0.4;
  } else if (level <= 20) {
    // Large (Level 11-20)
    rows = 30; cols = 20;
    targetSnakes = 60 + (level - 11) * 3;
    maxLen = 16; turnChance = 0.5;
  } else if (level <= 30) {
    // Huge (Level 21-30)
    rows = 40; cols = 25;
    targetSnakes = 90 + (level - 21) * 4;
    maxLen = 20; turnChance = 0.6;
  } else {
    // Gigantic (Level 31-50)
    rows = 50; cols = 30;
    targetSnakes = 130 + (level - 31) * 5; // Up to ~225 snakes!
    maxLen = 50; turnChance = 0.7;
  }

  // Cap target snakes to avoid infinite loops if grid is too full
  const totalCells = rows * cols;
  targetSnakes = Math.min(targetSnakes, Math.floor(totalCells * 0.4)); // Max 40% density

  const arrows: Arrow[] = [];
  const occupied = new Set<string>(); // "r,c" string

  let attempts = 0;
  const maxAttempts = 10000;

  // GENERATION ALGORITHM: "Safe Stacking"
  // We place snakes one by one. 
  // Constraint: A new snake must NOT block the exit path of any EXISTING snake.
  // This guarantees that existing snakes (which were solvable before) remain solvable.
  // The new snake can be blocked by existing snakes (it will just have to wait for them).
  // This builds a dependency chain: Oldest snakes -> Exit First. Newest snakes -> Exit Last.

  while (arrows.length < targetSnakes && attempts < maxAttempts) {
    attempts++;

    // 1. Pick a random empty head position
    const head: Point = {
      r: Math.floor(Math.random() * rows),
      c: Math.floor(Math.random() * cols)
    };

    if (isOccupied(head, occupied)) continue;

    // 2. Pick a random exit direction
    const exitDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

    // 3. Generate Body (Reverse walk from Head)
    // The snake "points" in exitDir. So the body trails behind in opposite(exitDir).
    const growthDirStart = getOppositeDir(exitDir);
    const potentialSegments: Point[] = [head];
    let curr = head;
    let currGrowthDir = growthDirStart;

    const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    let validBody = true;

    for (let i = 1; i < len; i++) {
      // Maybe turn
      if (Math.random() < turnChance) {
        const dirs = DIRECTIONS.filter(d => d !== currGrowthDir && d !== getOppositeDir(currGrowthDir));
        currGrowthDir = dirs[Math.floor(Math.random() * dirs.length)];
      }

      const next = {
        r: curr.r + DIR_OFFSETS[currGrowthDir].r,
        c: curr.c + DIR_OFFSETS[currGrowthDir].c
      };

      if (!isValidPos(next, rows, cols) || isOccupied(next, occupied)) {
        // Hit wall or existing snake
        validBody = false;
        break;
      }

      // Self-intersection check
      if (potentialSegments.some(s => s.r === next.r && s.c === next.c)) {
        validBody = false;
        break;
      }

      potentialSegments.push(next);
      curr = next;
    }

    if (!validBody) continue;

    // 4. Now we have a candidate snake (body + direction).
    // Verify it doesn't block any EXISTING snake.
    let blocksExisting = false;
    const newSnakeCells = new Set(potentialSegments.map(p => `${p.r},${p.c}`));

    for (const existing of arrows) {
      // Trace existing snake's path to edge
      let p = { ...existing.segments[0] }; // Head
      const dir = existing.direction;
      const dOffset = DIR_OFFSETS[dir];

      let blocked = false;

      // Walk until edge
      while (true) {
        p = { r: p.r + dOffset.r, c: p.c + dOffset.c };
        if (!isValidPos(p, rows, cols)) break; // Reached edge safely

        // Does this path cell overlap with the NEW snake?
        if (newSnakeCells.has(`${p.r},${p.c}`)) {
          blocked = true;
          break;
        }
      }

      if (blocked) {
        blocksExisting = true;
        break;
      }
    }

    if (blocksExisting) {
      // Invalid placement, would create a deadlock or make an existing puzzle impossible
      continue;
    }

    // 5. Success! Add snake.
    potentialSegments.forEach(p => occupied.add(`${p.r},${p.c}`));
    arrows.push({
      id: `arrow-${level}-${arrows.length}`,
      segments: potentialSegments,
      direction: exitDir,
      state: 'idle',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      length: potentialSegments.length
    });
  }

  return { arrows, rows, cols };
};