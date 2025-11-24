
import React from 'react';

interface Props {
  isEven: boolean;
}

export const GridCell: React.FC<Props> = React.memo(({ isEven }) => {
  return (
    <div 
      className={`w-full h-full flex items-center justify-center`}
    >
        {/* Minimal dot for grid */}
      <div className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
    </div>
  );
});
