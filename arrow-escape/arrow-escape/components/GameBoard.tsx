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
  const [scale, setScale] = useState(1.0);

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

      // Reset scale on level change or resize
      setScale(1.0);
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

    // Adjust click coordinates for scale
    // When scaled up (e.g. 2x), the visual pixels are larger, so we need to divide by scale
    // to get back to the SVG coordinate system
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

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

  // Zoom Handlers
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.0);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative bg-paper">

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-white/80 p-2 rounded-lg shadow-md backdrop-blur-sm">
        <button onClick={handleZoomIn} className="p-2 hover:bg-blue-100 rounded-full" title="Zoom In">➕</button>
        <button onClick={handleResetZoom} className="p-2 hover:bg-blue-100 rounded-full text-xs font-bold" title="Reset">1:1</button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-blue-100 rounded-full" title="Zoom Out">➖</button>
      </div>

      {/* Grid Container with Scale Transform */}
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out'
        }}
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