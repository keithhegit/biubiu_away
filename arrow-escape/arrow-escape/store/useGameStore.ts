import { create } from 'zustand';
import { Arrow, GameState, Point, Direction } from '../types';
import { generateLevel } from '../utils/generator';
import { getDistanceToArrow } from '../utils/geometry';
import { DIR_OFFSETS } from '../constants';

interface GameStore extends GameState {
    // Actions
    loadLevel: (level: number) => void;
    clickArrow: (arrowId: string) => void;
    updateGameLoop: () => void;
    setZoom: (scale: number) => void;
    resetLevel: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial State
    level: 1,
    hp: 3,
    status: 'playing',
    grid: { rows: 12, cols: 9 },
    arrows: [],
    score: 0,
    timeElapsed: 0,

    // Actions
    loadLevel: (level: number) => {
        const { arrows, rows, cols } = generateLevel(level);
        set({
            level,
            hp: 3,
            status: 'playing',
            grid: { rows, cols },
            arrows,
            timeElapsed: 0
        });
    },

    resetLevel: () => {
        const { level } = get();
        get().loadLevel(level);
    },

    setZoom: (scale: number) => {
        // This might be UI state, but keeping it here for now or separate UI store
        // Actually, zoom is better in a separate UI store or local state if it doesn't affect logic
        // For now, let's keep it out of game logic store to keep it pure
    },

    clickArrow: (arrowId: string) => {
        const { status, arrows, hp } = get();
        if (status !== 'playing') return;

        const arrowIndex = arrows.findIndex(a => a.id === arrowId);
        if (arrowIndex === -1) return;

        const arrow = arrows[arrowIndex];
        if (arrow.state !== 'idle') return;

        // Logic to check if path is clear
        // ... (Reuse logic from useGameLogic)
        // For now, let's just implement the basic state transition
        // We need to port the full collision logic here

        // Simplified collision check for this step
        const isBlocked = checkCollision(arrow, arrows);

        if (isBlocked) {
            // Stuck logic
            const newArrows = [...arrows];
            newArrows[arrowIndex] = { ...arrow, state: 'stuck' };
            set(state => ({
                arrows: newArrows,
                hp: Math.max(0, state.hp - 1),
                status: state.hp - 1 <= 0 ? 'game_over' : 'playing'
            }));

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
        }
    },

    updateGameLoop: () => {
        const { status, arrows, grid } = get();
        if (status !== 'playing') return;

        let hasMoving = false;
        let needsUpdate = false;

        const newArrows = arrows.map(arrow => {
            if (arrow.state !== 'moving') return arrow;

            hasMoving = true;
            const offset = DIR_OFFSETS[arrow.direction];
            const speed = 0.5; // Movement speed

            // Update all segments
            const newSegments = arrow.segments.map(seg => ({
                r: seg.r + offset.r * speed,
                c: seg.c + offset.c * speed
            }));

            // Check if head is out of bounds (plus some buffer)
            const head = newSegments[0];
            const isOut = head.r < -5 || head.r > grid.rows + 5 || head.c < -5 || head.c > grid.cols + 5;

            if (isOut) {
                needsUpdate = true;
                return null; // Mark for removal
            }

            needsUpdate = true;
            return { ...arrow, segments: newSegments };
        }).filter(Boolean) as Arrow[];

        if (needsUpdate) {
            set({ arrows: newArrows });

            // Check win condition
            if (newArrows.length === 0) {
                set({ status: 'won' });
            }
        }
    }
}));

// Helper for collision (simplified port from useGameLogic)
function checkCollision(targetArrow: Arrow, allArrows: Arrow[]): boolean {
    // ... logic to be ported fully ...
    // For this initial step, I'll just return false to test the store structure
    // Real implementation needs the full geometry check

    // Porting the logic from useGameLogic.ts
    const { segments, direction } = targetArrow;
    const head = segments[0];
    const offset = DIR_OFFSETS[direction];

    // Raycast from head in direction
    // Check against all other IDLE arrows

    // This requires the grid dimensions which are in store. 
    // But for a pure function we might need to pass them or just check intersection with other segments.

    // Let's implement a robust geometric check here later.
    // For now, assume valid for UI testing.
    return false;
}
