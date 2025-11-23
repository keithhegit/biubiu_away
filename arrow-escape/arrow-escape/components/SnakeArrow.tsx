import React, { useMemo } from 'react';
import { Arrow, Direction } from '../types';

interface Props {
  arrow: Arrow;
  cellSize: number;
  onClick: (id: string) => void;
}

export const SnakeArrow: React.FC<Props> = ({ arrow, cellSize, onClick }) => {
  const { segments, direction, state, color } = arrow;

  // Calculate SVG path
  const pathData = useMemo(() => {
    if (segments.length === 0) return '';
    
    const points = segments.map(p => ({
      x: p.c * cellSize + cellSize / 2,
      y: p.r * cellSize + cellSize / 2
    }));

    // Start at tail
    const tail = points[points.length - 1];
    let d = `M ${tail.x} ${tail.y}`;

    // Draw line to head
    for (let i = points.length - 2; i >= 0; i--) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }

    return d;
  }, [segments, cellSize]);

  const headPos = segments[0];
  const headPixel = {
    x: headPos.c * cellSize + cellSize / 2,
    y: headPos.r * cellSize + cellSize / 2
  };
  
  const tailPos = segments[segments.length - 1];
  const tailPixel = {
    x: tailPos.c * cellSize + cellSize / 2,
    y: tailPos.r * cellSize + cellSize / 2
  };

  let rot = 0;
  switch (direction) {
    case Direction.UP: rot = -90; break;
    case Direction.DOWN: rot = 90; break;
    case Direction.LEFT: rot = 180; break;
    case Direction.RIGHT: rot = 0; break;
  }

  const animClass = state === 'stuck' ? 'animate-shake' : 'transition-transform duration-100 active:scale-95';

  return (
    <g 
      onClick={(e) => { e.stopPropagation(); onClick(arrow.id); }} 
      className={`cursor-pointer ${animClass} group`}
      style={{ pointerEvents: 'all' }} 
    >
      {/* HITBOX - Significantly increased for better touch response */}
      <path 
        d={pathData} 
        stroke="transparent" 
        strokeWidth={cellSize * 1.4} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Outline (White Border) */}
      <path 
        d={pathData} 
        stroke="white" 
        strokeWidth={cellSize * 0.6} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Main Body (Navy/Color) */}
      <path 
        d={pathData} 
        stroke={color} 
        strokeWidth={cellSize * 0.4} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />

      {/* Tail Dot (Solid Circle) */}
      <circle 
        cx={tailPixel.x}
        cy={tailPixel.y}
        r={cellSize * 0.2}
        fill={color}
        stroke="white"
        strokeWidth="2"
      />

      {/* Head (Triangle) */}
      <g transform={`translate(${headPixel.x}, ${headPixel.y}) rotate(${rot})`}>
        {/* White backing for head to cover line end */}
        <path 
            d={`M -${cellSize * 0.1} -${cellSize * 0.25} L ${cellSize * 0.35} 0 L -${cellSize * 0.1} ${cellSize * 0.25} Z`}
            fill="white"
        />
        {/* Colored Arrow Head */}
        <path 
            d={`M -${cellSize * 0.05} -${cellSize * 0.2} L ${cellSize * 0.3} 0 L -${cellSize * 0.05} ${cellSize * 0.2} Z`}
            fill={color}
        />
      </g>
    </g>
  );
};