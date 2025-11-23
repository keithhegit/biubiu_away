import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowEntity, GameConfig, Direction } from './types';
import { generateLevel, checkCollision } from './services/gameLogic';
import { Arrow } from './components/Arrow';
import { audioService } from './services/audioService';
import { Heart, RefreshCcw, Trophy, Play, Settings } from 'lucide-react';

const INITIAL_LIVES = 3;
const MAX_LEVEL = 50;

export default function App() {
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(INITIAL_LIVES);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'WON' | 'LOST'>('MENU');
  const [arrows, setArrows] = useState<ArrowEntity[]>([]);
  const [config, setConfig] = useState<GameConfig>({ rows: 10, cols: 10, arrowCount: 0 });
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);

  const timerRef = useRef<number | null>(null);

  const startLevel = useCallback((lvl: number) => {
    const { arrows: newArrows, config: newConfig } = generateLevel(lvl);
    setArrows(newArrows);
    setConfig(newConfig);
    setHp(INITIAL_LIVES);
    setTimeElapsed(0);
    setGameState('PLAYING');
    
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  }, []);

  const handleResize = useCallback(() => {
    if (gridRef.current && config.cols > 0) {
      const w = gridRef.current.clientWidth - 24; // Padding
      const h = gridRef.current.clientHeight - 24;
      
      const sizeW = Math.floor(w / config.cols);
      const sizeH = Math.floor(h / config.rows);
      
      // Allow larger cells for small grids so it fills the screen better.
      // Increased max size to 110 to handle Level 3 (small grid) on desktop/tablets better.
      setCellSize(Math.min(sizeW, sizeH, 110)); 
    }
  }, [config]);

  useEffect(() => {
    // Small delay to ensure DOM is ready for calculations
    const t = setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [handleResize, gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING' && timerRef.current) {
        window.clearInterval(timerRef.current);
    }
  }, [gameState]);

  const handleArrowClick = (id: string) => {
    if (gameState !== 'PLAYING') return;

    const clickedArrow = arrows.find(a => a.id === id);
    if (!clickedArrow || clickedArrow.state !== 'IDLE') return;

    const isBlocked = checkCollision(clickedArrow, arrows, config);

    if (isBlocked) {
      audioService.playBlock();
      setArrows(prev => prev.map(a => a.id === id ? { ...a, state: 'BLOCKED' } : a));
      setHp(prev => {
        const newHp = prev - 1;
        if (newHp <= 0) {
            setGameState('LOST');
        }
        return newHp;
      });

      setTimeout(() => {
        setArrows(prev => prev.map(a => a.id === id ? { ...a, state: 'IDLE' } : a));
      }, 500);
    } else {
      audioService.playWhoosh();
      
      // Set state to FLYING. The component handles the slither animation.
      setArrows(prev => prev.map(a => a.id === id ? { ...a, state: 'FLYING' } : a));

      // Wait for animation to complete before removing from DOM
      // Slither speed is ~15 cells/sec. Max snake length ~8 + screen width ~10 = ~1.2s max.
      // 1000ms should be sufficient for most, and visual clipping is fine.
      setTimeout(() => {
          setArrows(prev => {
             const remaining = prev.filter(a => a.state === 'IDLE' || a.state === 'BLOCKED');
             if (remaining.length === 0) {
                 if (level >= MAX_LEVEL) {
                     setGameState('WON'); 
                 } else {
                    audioService.playWin();
                    setGameState('WON');
                 }
             }
             return prev;
          });
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in px-4">
      <div className="relative group cursor-default">
         <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 tracking-tighter text-center leading-tight">
            SNAKE<br/>AWAY
         </div>
         <div className="absolute -top-6 -right-6 text-5xl animate-bounce group-hover:scale-110 transition-transform">🐍</div>
      </div>
      <div className="text-slate-500 text-center max-w-xs font-medium text-lg">
        Tap the snake heads to help them slither away!
      </div>
      <button 
        onClick={() => startLevel(1)}
        className="bg-indigo-600 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-3"
      >
        <Play size={28} fill="currentColor" /> Start Game
      </button>
    </div>
  );

  const renderWin = () => (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-bounce-in border-4 border-white/50">
        <div className="relative">
            <Trophy size={80} className="text-yellow-400 drop-shadow-sm" />
            <div className="absolute top-0 right-0 animate-ping h-4 w-4 rounded-full bg-yellow-200"></div>
        </div>
        <div>
            <h2 className="text-3xl font-black text-slate-800 mb-1">
                {level === MAX_LEVEL ? "ALL CLEAR!" : "NICE JOB!"}
            </h2>
            <p className="text-slate-400 font-medium">Level {level} Complete</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl w-full justify-between">
            <div className="text-left">
                <p className="text-xs text-slate-400 uppercase font-bold">Time</p>
                <p className="text-xl font-bold text-slate-700">{formatTime(timeElapsed)}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold">Lives</p>
                <div className="flex gap-1">
                    {[...Array(hp)].map((_, i) => <Heart key={i} size={16} className="fill-red-500 text-red-500" />)}
                </div>
            </div>
        </div>
        <button 
          onClick={() => {
              if (level < MAX_LEVEL) {
                  setLevel(l => l + 1);
                  startLevel(level + 1);
              } else {
                  setGameState('MENU');
              }
          }}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-400 transition-all active:scale-95"
        >
          {level === MAX_LEVEL ? "Main Menu" : "Next Level"}
        </button>
      </div>
    </div>
  );

  const renderLost = () => (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-shake border-4 border-white/50">
        <div className="text-7xl grayscale">💔</div>
        <div>
             <h2 className="text-3xl font-black text-slate-800">OOPS!</h2>
             <p className="text-slate-500 font-medium mt-2">The snakes are tangled.</p>
        </div>
        <button 
          onClick={() => startLevel(level)}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all active:scale-95 flex justify-center items-center gap-2"
        >
          <RefreshCcw size={22} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50 select-none font-sans">
      {/* Header */}
      {gameState !== 'MENU' && (
        <header className="px-6 py-4 bg-white/80 backdrop-blur-sm flex justify-between items-center z-20 border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setGameState('MENU')} 
               className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors active:bg-slate-200"
             >
               <Settings size={24} />
             </button>
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level</span>
               <span className="text-2xl font-black text-indigo-600 leading-none">{level}</span>
             </div>
          </div>

          <div className="flex flex-col items-center bg-slate-100/80 px-4 py-1.5 rounded-full border border-slate-200/50">
             <span className="text-sm font-mono font-bold text-slate-600 tabular-nums">{formatTime(timeElapsed)}</span>
          </div>
          
          <div className="flex gap-1">
             {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  size={26} 
                  className={`transition-all duration-300 filter drop-shadow-sm ${i < hp ? 'fill-red-500 text-red-500 scale-100' : 'fill-slate-200 text-slate-200 scale-90'}`} 
                />
             ))}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 relative p-4 flex flex-col items-center justify-center w-full h-full overflow-hidden">
        {gameState === 'MENU' && renderMenu()}
        
        {gameState !== 'MENU' && (
            <div className="flex-1 flex items-center justify-center w-full max-w-5xl animate-fade-in" ref={gridRef}>
                <div 
                    className="relative bg-white rounded-2xl shadow-xl transition-all duration-500 ease-out border border-slate-100"
                    style={{
                        width: config.cols * cellSize,
                        height: config.rows * cellSize,
                        backgroundSize: `${cellSize}px ${cellSize}px`,
                        backgroundImage: `radial-gradient(circle, #cbd5e1 2px, transparent 2px)`, // Subtle dots
                    }}
                >
                    {arrows.map(arrow => (
                        <Arrow 
                            key={arrow.id} 
                            arrow={arrow} 
                            cellSize={cellSize} 
                            onClick={handleArrowClick} 
                        />
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* Modals */}
      {gameState === 'WON' && renderWin()}
      {gameState === 'LOST' && renderLost()}

      {/* Hint Footer */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
            <span className="text-slate-500 text-sm font-semibold bg-white/90 px-6 py-2.5 rounded-full backdrop-blur-md shadow-lg border border-slate-100/50">
                 Tap the snake heads to release them!
            </span>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px) rotate(-2deg); }
          40% { transform: translateX(5px) rotate(2deg); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3); }
            50% { opacity: 1; transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
        .animate-bounce-in {
            animation: bounceIn 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
        }
      `}</style>
    </div>
  );
}