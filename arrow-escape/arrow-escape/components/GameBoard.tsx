import React, { useRef, useEffect, useState } from 'react';
import { GameState } from '../types';
import { SnakeArrow } from './SnakeArrow';
import { GridCell } from './GridCell';
import { getDistanceToArrow } from '../utils/geometry';

interface Props {
  gameState: GameState;
  onArrowClick: (id: string) => void;
}

export const GameBoard: React.FC<Props> = ({ gameState, onArrowClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(30);

  // Responsive Grid Sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const rows = gameState.gridRows;
      const cols = gameState.gridCols;

      // Add small margin (16px total horizontal)
      const maxW = clientWidth - 16;
      const maxH = clientHeight - 16;

      const sizeByWidth = maxW / cols;
      const sizeByHeight = maxH / rows;

      // Use the smaller dimension to fit the grid perfectly
      setCellSize(Math.min(sizeByWidth, sizeByHeight));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gameState.gridRows, gameState.gridCols]);

  // Geometric Click Detection
  const handleBoardClick = (e: React.MouseEvent<SVGElement>) => {
    if (gameState.status !== 'playing') return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate distances to all idle arrows
    const distances = gameState.arrows
      .filter(arrow => arrow.state === 'idle')
      .map(arrow => ({
        arrow,
        distance: getDistanceToArrow(clickX, clickY, arrow, cellSize)
      }));

    // Find the closest arrow within threshold
    // Increased to 2.5 to handle larger grids and longer arrows in higher levels
    // Level 2 showed distances up to 61px with cellSize=28
    const threshold = cellSize * 2.5;

    const closest = distances
      .filter(d => d.distance < threshold)
      .sort((a, b) => a.distance - b.distance)[0];

    if (closest) {
      onArrowClick(closest.arrow.id);
    }
  };

  const width = cellSize * gameState.gridCols;
  const height = cellSize * gameState.gridRows;

  return (
    <div ref={containerRef} className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative bg-paper">

      {/* Grid Container */}
      <div
        style={{ width, height }}
        className="relative bg-white/50 shadow-sm"
      >
        {/* Background Grid Layer */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${gameState.gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gameState.gridRows}, 1fr)`
          }}
        >
          {Array.from({ length: gameState.gridRows * gameState.gridCols }).map((_, i) => (
            <GridCell key={i} isEven={i % 2 === 0} />
          ))}
        </div>

        {/* Arrow Layer */}
        <svg
          width={width}
          height={height}
          className="absolute inset-0 z-10 overflow-visible cursor-pointer"
          onClick={handleBoardClick}
        >
          {gameState.arrows.map(arrow => (
            <SnakeArrow
              key={arrow.id}
              arrow={arrow}
              cellSize={cellSize}
            />
          ))}
        </svg>

      </div>
    </div>
  );
};