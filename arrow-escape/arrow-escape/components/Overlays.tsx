import React from 'react';

interface Props {
  status: 'won' | 'lost';
  score: number;
  level: number;
  onRetry: () => void;
  onNext: () => void;
}

export const Overlays: React.FC<Props> = ({ status, score, level, onRetry, onNext }) => {
  if (status === 'won') {
    return (
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center transform scale-100 animate-[bounce_1s]">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-accent mb-2">LEVEL {level} CLEARED!</h2>
          <p className="text-gray-500 mb-6">Score: {score}</p>
          <button 
            onClick={onNext}
            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-colors"
          >
            NEXT LEVEL
          </button>
        </div>
      </div>
    );
  }

  if (status === 'lost') {
    return (
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-3xl font-black text-danger mb-2">OUT OF MOVES</h2>
          <p className="text-gray-500 mb-6">Don't give up!</p>
          <button 
            onClick={onRetry}
            className="w-full bg-danger text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-600 transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return null;
};