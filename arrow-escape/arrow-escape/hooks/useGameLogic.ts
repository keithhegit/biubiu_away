
import { useState, useEffect, useCallback, useRef } from 'react';
import { Arrow, GameState, Point, Direction } from '../types';
import { generateLevel } from '../utils/generator';
import { DIR_OFFSETS } from '../constants';
import * as Sound from '../utils/sound';

const ANIMATION_SPEED_MS = 30; // Faster animation for smoother feel

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    hp: 3,
    maxHp: 3,
    status: 'playing',
    gridRows: 12,
    gridCols: 9,
    arrows: [],
    score: 0,
    timeElapsed: 0,
  });

  const timerRef = useRef<number>(0);
  const moveIntervalRef = useRef<number>(0);

  // Initialize Level
  const loadLevel = useCallback((level: number) => {
    // Clear intervals
    clearInterval(moveIntervalRef.current);
    
    const { arrows, rows, cols } = generateLevel(level);
    setGameState(prev => ({
      ...prev,
      level,
      gridRows: rows,
      gridCols: cols,
      arrows,
      status: 'playing',
      // Keep score if next level, reset if retry (handled by caller usually, but safe here)
    }));
  }, []);

  // Initial Load
  useEffect(() => {
    loadLevel(1);
  }, [loadLevel]);

  // Timer
  useEffect(() => {
    if (gameState.status === 'playing') {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState.status]);

  // Movement Loop
  useEffect(() => {
    moveIntervalRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.status !== 'playing') return prev;

        const movingArrows = prev.arrows.filter(a => a.state === 'moving');
        if (movingArrows.length === 0) return prev;

        // Clone arrows to mutate
        const newArrows = prev.arrows.map(a => ({ ...a, segments: [...a.segments] }));
        let arrowsToRemove: string[] = [];
        let hasMovement = false;

        newArrows.forEach(arrow => {
          if (arrow.state !== 'moving') return;
          hasMovement = true;

          // Shift logic:
          const offset = DIR_OFFSETS[arrow.direction];
          const currentHead = arrow.segments[0];
          const newHead = { r: currentHead.r + offset.r, c: currentHead.c + offset.c };

          arrow.segments.unshift(newHead);
          arrow.segments.pop();

          // Check off-screen
          const isOffScreen = arrow.segments.every(seg => 
            seg.r < 0 || seg.r >= prev.gridRows || seg.c < 0 || seg.c >= prev.gridCols
          );

          if (isOffScreen) {
            arrowsToRemove.push(arrow.id);
          }
        });

        if (!hasMovement) return prev;

        const remainingArrows = newArrows.filter(a => !arrowsToRemove.includes(a.id));

        // Win Condition
        if (remainingArrows.length === 0 && prev.arrows.length > 0) {
            Sound.playWin();
            setTimeout(() => nextLevel(), 500);
            return {
                ...prev,
                arrows: remainingArrows,
                status: 'won',
                score: prev.score + (prev.level * 100)
            };
        }

        return {
          ...prev,
          arrows: remainingArrows,
        };
      });
    }, ANIMATION_SPEED_MS);

    return () => clearInterval(moveIntervalRef.current);
  }, []); // Run once on mount

  const nextLevel = () => {
    setGameState(prev => {
        const nextLvl = prev.level + 1;
        // Small delay to allow react to render the won state for a split second if needed, 
        // but typically we want to load immediately after the timeout in the loop.
        // However, we need to break the render cycle.
        setTimeout(() => loadLevel(nextLvl), 0);
        return prev;
    });
  };

  const retryLevel = () => {
    setGameState(prev => ({ ...prev, hp: prev.maxHp, status: 'playing' }));
    loadLevel(gameState.level);
  };

  const handleArrowClick = (arrowId: string) => {
    if (gameState.status !== 'playing') return;

    // Find the arrow in current state to ensure we have fresh data
    setGameState(current => {
        const arrow = current.arrows.find(a => a.id === arrowId);
        if (!arrow || arrow.state !== 'idle') return current;

        // VALIDATION
        let pathBlocked = false;
        let currentPos = { ...arrow.segments[0] }; 
        const offset = DIR_OFFSETS[arrow.direction];
        
        let steps = 0;
        const maxSteps = Math.max(current.gridRows, current.gridCols);

        while (steps < maxSteps) {
          currentPos.r += offset.r;
          currentPos.c += offset.c;
          steps++;

          if (currentPos.r < 0 || currentPos.r >= current.gridRows || currentPos.c < 0 || currentPos.c >= current.gridCols) {
            break; 
          }

          // Collision check
          for (const other of current.arrows) {
            if (other.id === arrow.id) continue;
            // Moving arrows are not obstacles (they are flying away)
            if (other.state === 'moving') continue; 

            for (const seg of other.segments) {
              if (seg.r === currentPos.r && seg.c === currentPos.c) {
                pathBlocked = true;
                break;
              }
            }
            if (pathBlocked) break;
          }
          if (pathBlocked) break;
        }

        if (pathBlocked) {
          Sound.playError();
          const newHp = current.hp - 1;
          
          // Mark as stuck temporarily
          const newArrows = current.arrows.map(a => a.id === arrowId ? { ...a, state: 'stuck' as const } : a);

          // Trigger reset of stuck state after delay
          setTimeout(() => {
            setGameState(g => ({
                ...g,
                arrows: g.arrows.map(a => a.id === arrowId ? { ...a, state: 'idle' as const } : a)
            }));
          }, 500);

          return {
            ...current,
            hp: newHp,
            arrows: newArrows,
            status: newHp <= 0 ? 'lost' : 'playing'
          };

        } else {
          Sound.playSwoosh();
          const newArrows = current.arrows.map(a => a.id === arrowId ? { ...a, state: 'moving' as const } : a);
          return { ...current, arrows: newArrows };
        }
    });
  };

  return {
    gameState,
    handleArrowClick,
    retryLevel,
    nextLevel
  };
};
