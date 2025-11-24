import React, { useEffect, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { ZoomTutorial } from './components/ZoomTutorial';
import { useGameStore } from './store/useGameStore';
import { playBGM, pauseBGM, toggleBGM } from './utils/bgm';
import { Music, Music2 } from 'lucide-react';

const App: React.FC = () => {
  const { level, hp, score, status, loadLevel } = useGameStore();
  const [bgmPlaying, setBGMPlaying] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);

  // Auto-play BGM on first user interaction
  useEffect(() => {
    const startBGM = () => {
      playBGM();
      setBGMPlaying(true);
      document.removeEventListener('click', startBGM);
    };
    document.addEventListener('click', startBGM);
    return () => document.removeEventListener('click', startBGM);
  }, []);

  // Pause BGM on game over/win
  useEffect(() => {
    if (status !== 'playing') {
      pauseBGM();
      setBGMPlaying(false);
    } else if (!bgmPlaying) {
      playBGM();
      setBGMPlaying(true);
    }
  }, [status]);

  const handleBGMToggle = () => {
    const playing = toggleBGM();
    setBGMPlaying(playing);
  };

  const handleLevelSelect = (lvl: number) => {
    loadLevel(lvl);
    setShowLevelSelector(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>🎯</span> BiuBiu
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

          {/* BGM Toggle */}
          <button
            onClick={handleBGMToggle}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={bgmPlaying ? "Mute BGM" : "Play BGM"}
          >
            {bgmPlaying ? <Music2 size={20} className="text-blue-600" /> : <Music size={20} className="text-slate-400" />}
          </button>

          {/* Level Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLevelSelector(!showLevelSelector)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold"
            >
              选关 ▼
            </button>
            {showLevelSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-h-80 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => handleLevelSelect(lvl)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${lvl === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}
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