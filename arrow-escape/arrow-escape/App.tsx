
{/* Game Over / Win Overlay */ }
{
  status !== 'playing' && (
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
  )
}

{/* Zoom Tutorial - Show on level 2+ */ }
{ level >= 2 && <ZoomTutorial /> }
    </div >
  );
};

export default App;