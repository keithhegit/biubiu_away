import React from 'react';
import { GameBoard } from './components/GameBoard';
import { ZoomTutorial } from './components/ZoomTutorial';
import { useGameStore } from './store/useGameStore';

const App: React.FC = () => {
  const { level, hp, score, status } = useGameStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>🎯</span> Arrow Escape
        </h1>

        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">LEVEL</span>
            <span className="text-lg text-slate-900">{level}</span>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xl ${i < hp ? 'text-red-500' : 'text-slate-200'}`}>
                ♥
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">SCORE</span>
            <span className="text-lg text-slate-900">{score}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative overflow-hidden">
        <GameBoard />
      </main>

      {/* Game Over / Win Overlay */}
      {status !== 'playing' && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">
              {status === 'won' ? '🎉' : '💔'}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {status === 'won' ? 'Level Complete!' : 'Game Over'}
            </h2>
            <p className="text-slate-500 mb-6">
              {status === 'won' ? 'Great job! Ready for the next challenge?' : 'Don\'t give up! Try again.'}
            </p>
            <button
              onClick={() => {
                if (status === 'won') {
                  useGameStore.getState().nextLevel();
                } else {
                  useGameStore.getState().resetLevel();
                }
              }}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              {status === 'won' ? 'Next Level' : 'Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* Zoom Tutorial - Show on level 2+ */}
      {level >= 2 && <ZoomTutorial />}
    </div>
  );
};

export default App;