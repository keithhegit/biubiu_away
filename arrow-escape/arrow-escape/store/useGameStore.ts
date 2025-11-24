
import { create } from 'zustand';
import { Arrow, GameState, Point, Direction } from '../types';
import { generateLevel } from '../utils/generator';
import { getDistanceToArrow } from '../utils/geometry';
import { DIR_OFFSETS } from '../constants';
import * as Sound from '../utils/sound';

interface GameStore extends GameState {
    // Actions
    loadLevel: (level: number) => void;
    clickArrow: (arrowId: string) => void;
    updateGameLoop: () => void;
    setZoom: (scale: number) => void;
    resetLevel: () => void;
    nextLevel: () => void;
    lastMoveTime: number;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial State
    level: 1,
    hp: 3,
    maxHp: 3,
    status: 'playing',
    gridRows: 12,
    gridCols: 9,
    arrows: [],
    score: 0,
    timeElapsed: 0,
    lastMoveTime: 0,

    // Actions
    loadLevel: (level: number) => {
        const { arrows, rows, cols } = generateLevel(level);
        set({
            level,
            hp: 3,
            maxHp: 3,
            status: 'playing',
            gridRows: rows,
            gridCols: cols,
            arrows,
            timeElapsed: 0,
            lastMoveTime: 0
        });
    },

    nextLevel: () => {
        const { level } = get();
        const nextLvl = level + 1;
        set({ level: nextLvl });
        get().loadLevel(nextLvl);
    },

    clickArrow: (arrowId: string) => {
        const { status, arrows, hp, gridRows, gridCols } = get();
        if (status !== 'playing') return;

        const arrowIndex = arrows.findIndex(a => a.id === arrowId);
        if (arrowIndex === -1) return;

        const arrow = arrows[arrowIndex];
        if (arrow.state !== 'idle') return;

        // Collision check
        const isBlocked = checkCollision(arrow, arrows, gridRows, gridCols);

        if (isBlocked) {
            // Stuck logic
            const newArrows = [...arrows];
            newArrows[arrowIndex] = { ...arrow, state: 'stuck' };
            set(state => ({
                arrows: newArrows,
                hp: Math.max(0, state.hp - 1),
                status: state.hp - 1 <= 0 ? 'lost' : 'playing'
            }));

            // Play error sound
            Sound.playError();

            // Reset stuck state after animation
            setTimeout(() => {
                const currentArrows = get().arrows;
                const idx = currentArrows.findIndex(a => a.id === arrowId);
                if (idx !== -1) {
                    const resetArrows = [...currentArrows];
                    resetArrows[idx] = { ...resetArrows[idx], state: 'idle' };
                    set({ arrows: resetArrows });
                }
            }, 500);
        } else {
            // Moving logic
            const newArrows = [...arrows];
            newArrows[arrowIndex] = { ...arrow, state: 'moving' };
            set({ arrows: newArrows });
            Sound.playSwoosh();
        }
    },

    updateGameLoop: () => {
        const { status, arrows, gridRows, gridCols, lastMoveTime } = get();
        if (status !== 'playing') return;

        const now = performance.now();
        const MOVE_INTERVAL = 30; // 30ms = ~33fps (Matches original speed)

        if (now - lastMoveTime < MOVE_INTERVAL) return;

        let hasMoving = false;
        let needsUpdate = false;

        const newArrows = arrows.map(arrow => {
            if (arrow.state !== 'moving') return arrow;

            hasMoving = true;

            // Snake Movement Logic (Crawling)
            const offset = DIR_OFFSETS[arrow.direction];
            const currentHead = arrow.segments[0];
            const newHead = { r: currentHead.r + offset.r, c: currentHead.c + offset.c };

            // Add new head, remove tail
            const newSegments = [newHead, ...arrow.segments.slice(0, -1)];

            // Check if ENTIRE snake is out of bounds
            const isOffScreen = newSegments.every(seg =>
                seg.r < 0 || seg.r >= gridRows || seg.c < 0 || seg.c >= gridCols
            );

            if (isOffScreen) {
                needsUpdate = true;
                return null; // Mark for removal
            }

            needsUpdate = true;
            return { ...arrow, segments: newSegments };
        }).filter(Boolean) as Arrow[];

        if (needsUpdate) {
            set({
                arrows: newArrows,
                lastMoveTime: now
            });

            // Check win condition
            if (newArrows.length === 0) {
                set({ status: 'won' });
                Sound.playWin();
            }
        }
    }
}));

// Helper for collision
function checkCollision(targetArrow: Arrow, allArrows: Arrow[], rows: number, cols: number): boolean {
    let currentPos = { ...targetArrow.segments[0] }; // Start at head
    const offset = DIR_OFFSETS[targetArrow.direction];
    const maxSteps = Math.max(rows, cols);

    for (let i = 0; i < maxSteps; i++) {
        currentPos.r += offset.r;
        currentPos.c += offset.c;

        // Check if out of bounds (Escaped!)
        if (currentPos.r < 0 || currentPos.r >= rows || currentPos.c < 0 || currentPos.c >= cols) {
            return false; // Not blocked, path is clear to edge
        }

        // Check collision with other arrows
        for (const other of allArrows) {
            if (other.id === targetArrow.id) continue; // Skip self
            if (other.state === 'moving') continue; // Moving arrows don't block

            for (const seg of other.segments) {
                if (seg.r === currentPos.r && seg.c === currentPos.c) {
                    return true; // Blocked by this segment
                }
            }
        }
    }

    return false; // Should theoretically hit wall first, but safe fallback
}
