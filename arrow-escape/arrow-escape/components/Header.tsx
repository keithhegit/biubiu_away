import React from 'react';

interface Props {
  level: number;
  hp: number;
  maxHp: number;
  timeElapsed: number;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

export const Header: React.FC<Props> = ({ level, hp, maxHp, timeElapsed }) => {
  return (
    <div className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 sticky top-0 border-b border-gray-100">
      <div className="flex flex-col items-center">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-xl font-black text-accent tracking-tight">LEVEL {level}</div>
        <div className="flex space-x-1 mt-1">
          {Array.from({ length: maxHp }).map((_, i) => (
             <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < hp ? 'text-danger' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
           </svg>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center min-w-[3rem]">
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Time</span>
        <span className="text-sm font-semibold text-gray-600 font-mono">{formatTime(timeElapsed)}</span>
      </div>
    </div>
  );
};