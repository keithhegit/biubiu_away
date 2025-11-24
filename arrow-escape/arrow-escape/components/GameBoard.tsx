import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameTile } from './GameTile';
import { useGameStore } from '../store/useGameStore';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { arrows, grid, loadLevel, clickArrow, updateGameLoop, level } = useGameStore();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  // Game Loop
  const animate = () => {
    updateGameLoop();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    loadLevel(level);
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [level]); // Re-load when level changes

  // Zoom Controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setScale(1.0);

  // Calculate board dimensions
  const cellSize = 40; // Fixed cell size for better SVG rendering
  const width = grid.cols * cellSize;
  const height = grid.rows * cellSize;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#f5f6fa] flex items-center justify-center">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 bg-white p-2 rounded-lg shadow-md">
        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={20} /></button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded"><ZoomOut size={20} /></button>
        <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 rounded"><Maximize size={20} /></button>
      </div>

      {/* Game Grid Container */}
      <div
        ref={containerRef}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale})`,
          width: width,
          height: height
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible shadow-xl bg-white rounded-xl"
        >
          {/* Grid Dots Background */}
          <pattern id="grid-dots" x="0" y="0" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
            <circle cx={cellSize / 2} cy={cellSize / 2} r={1.5} fill="#cbd5e1" />
          </pattern>
          <rect width={width} height={height} fill="url(#grid-dots)" />

          {/* Arrows Layer */}
          <AnimatePresence>
            {arrows.map(arrow => (
              <GameTile
                key={arrow.id}
                arrow={arrow}
                cellSize={cellSize}
                onClick={clickArrow}
              />
            ))}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
};