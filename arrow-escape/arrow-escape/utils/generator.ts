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
  // Difficulty Shifting: Level 2 → Old Level 10, Level 3 → 11, etc.
  const adjustedLevel = level === 1 ? 1 : Math.min(level + 8, 50);

  // Config
  let rows = 12;
  let cols = 9;
  let targetSnakes = 15;
  let minLen = 2;
  let maxLen = 5;
  let turnChance = 0.2;

  // Difficulty Tiers - MASSIVELY INCREASED
  if (adjustedLevel === 1) {
    // Tutorial
    rows = 12; cols = 9; targetSnakes = 15;
    maxLen = 5; turnChance = 0.2;
  } else if (adjustedLevel <= 10) {
    rows = 24; cols = 14;
    targetSnakes = 60 + Math.floor((adjustedLevel - 2) * 10); // 60-140
    maxLen = 20; turnChance = 0.6;
  } else if (adjustedLevel <= 20) {
    rows = 35; cols = 22;
    targetSnakes = 140 + (adjustedLevel - 11) * 15; // 140-275
    maxLen = 40; turnChance = 0.75;
  } else if (adjustedLevel <= 35) {
    rows = 45; cols = 28;
    targetSnakes = 275 + (adjustedLevel - 21) * 20; // 275-555
    maxLen = 60; turnChance = 0.85;
  } else {
    // Gigantic - EXTREME DENSITY
    rows = 55; cols = 34;
    targetSnakes = 400 + (adjustedLevel - 36) * 25; // 400-750!
    maxLen = 100; turnChance = 0.92;
  }

  // Cap target snakes - 65% density
  const totalCells = rows * cols;
  targetSnakes = Math.min(targetSnakes, Math.floor(totalCells * 0.65));

  const arrows: Arrow[] = [];
  const occupied = new Set<string>();

  let attempts = 0;
  const maxAttempts = 10000;

  while (arrows.length < targetSnakes && attempts < maxAttempts) {
    attempts++;

    const head: Point = {
      r: Math.floor(Math.random() * rows),
      c: Math.floor(Math.random() * cols)
    };

    if (isOccupied(head, occupied)) continue;

    const exitDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const growthDirStart = getOppositeDir(exitDir);
    const potentialSegments: Point[] = [head];
    let curr = head;
    let currGrowthDir = growthDirStart;

    const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    let validBody = true;

    for (let i = 1; i < len; i++) {
      if (Math.random() < turnChance) {
        const dirs = DIRECTIONS.filter(d => d !== currGrowthDir && d !== getOppositeDir(currGrowthDir));
        currGrowthDir = dirs[Math.floor(Math.random() * dirs.length)];
      }

      const next = {
        r: curr.r + DIR_OFFSETS[currGrowthDir].r,
        c: curr.c + DIR_OFFSETS[currGrowthDir].c
      };

      if (!isValidPos(next, rows, cols) || isOccupied(next, occupied)) {
        validBody = false;
        break;
      }

      if (potentialSegments.some(s => s.r === next.r && s.c === next.c)) {
        validBody = false;
        break;
      }

      potentialSegments.push(next);
      curr = next;
    }

    if (!validBody) continue;

    let blocksExisting = false;
    const newSnakeCells = new Set(potentialSegments.map(p => `${p.r},${p.c}`));

    for (const existing of arrows) {
      let p = { ...existing.segments[0] };
      const dir = existing.direction;
      const dOffset = DIR_OFFSETS[dir];

      let blocked = false;

      while (true) {
        p = { r: p.r + dOffset.r, c: p.c + dOffset.c };
        if (!isValidPos(p, rows, cols)) break;

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

    if (blocksExisting) continue;

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