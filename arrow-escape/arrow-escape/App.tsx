import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { Overlays } from './components/Overlays';

const App: React.FC = () => {
  const { gameState, handleArrowClick, retryLevel, nextLevel } = useGameLogic();

  return (
    <div className="flex flex-col h-full w-full bg-paper">
      <Header 
        level={gameState.level} 
        hp={gameState.hp} 
        maxHp={gameState.maxHp} 
        timeElapsed={gameState.timeElapsed}
      />
      
      <main className="flex-1 relative overflow-hidden">
        <GameBoard 
          gameState={gameState} 
          onArrowClick={handleArrowClick} 
        />

        {(gameState.status === 'won' || gameState.status === 'lost') && (
          <Overlays 
            status={gameState.status}
            score={gameState.score}
            level={gameState.level}
            onRetry={retryLevel}
            onNext={nextLevel}
          />
        )}
      </main>

      <div className="text-center text-xs text-gray-300 py-1 absolute bottom-1 w-full pointer-events-none">
        Arrow Elimination v1.0
      </div>
    </div>
  );
};

export default App;