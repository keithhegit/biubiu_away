import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameTile } from './GameTile';
import { useGameStore } from '../store/useGameStore';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { arrows, gridRows, gridCols, loadLevel, clickArrow, updateGameLoop, level } = useGameStore();
  const [scale, setScale] = useState(1);
  const [cellSize, setCellSize] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTouchDistance = useRef<number>(0);

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
  }, [level]);

  // Auto-fit board to viewport
  useEffect(() => {
    const fitToViewport = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 32; // Padding
      const containerHeight = container.clientHeight - 32;

      // Calculate optimal cell size
      const maxCellWidth = containerWidth / gridCols;
      const maxCellHeight = containerHeight / gridRows;
      const optimalSize = Math.min(maxCellWidth, maxCellHeight, 40); // Cap at 40px

      setCellSize(Math.max(optimalSize, 20)); // Min 20px
    };

    fitToViewport();
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, [gridRows, gridCols]);

  // Pinch-to-zoom gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance.current > 0) {
        const delta = distance - lastTouchDistance.current;
        const scaleChange = delta * 0.01;
        setScale(prev => Math.min(Math.max(prev + scaleChange, 0.5), 3.0));
      }

      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = 0;
  };

  // Zoom Controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.0);

  // Calculate board dimensions
  const width = gridCols * cellSize;
  const height = gridRows * cellSize;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#f5f6fa] flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 bg-white p-2 rounded-lg shadow-md">
        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded transition-colors"><ZoomIn size={20} /></button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded transition-colors"><ZoomOut size={20} /></button>
        <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 rounded transition-colors"><Maximize size={20} /></button>
      </div>

      {/* Game Grid Container */}
      <div
        ref={boardRef}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
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