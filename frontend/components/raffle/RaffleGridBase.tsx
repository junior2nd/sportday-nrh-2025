'use client';

import { ReactNode } from 'react';

export interface RaffleGridBaseProps {
  winners: any[];
  revealedWinners: any[];
  spinningCards: boolean[];
  error: string | null;
  loading: boolean;
  eventId?: number;
  gridCols: string;
  gap: string;
  containerClassName?: string;
  children?: ReactNode;
  displayCount?: number;
  textSize?: string; // Optional: override text size
  cardPadding?: string; // Optional: override card padding
}

export default function RaffleGridBase({
  error,
  loading,
  winners,
  gridCols,
  gap,
  containerClassName = '',
  children,
  displayCount = 1,
}: RaffleGridBaseProps) {
  // Container classes
  const baseClasses = `grid ${gap} text-center`;
  const heightClasses = displayCount === 1 
    ? 'flex-1 min-h-0 mb-2' 
    : 'h-[calc(100vh-100px)] overflow-auto';
  const containerClasses = `${baseClasses} ${heightClasses} ${gridCols} ${containerClassName}`;

  // Error col-span
  const errorColSpan = gridCols.replace('grid-cols-', 'col-span-');

  return (
    <div 
      className={containerClasses}
      style={{ 
        gridAutoRows: '1fr',
        gridAutoFlow: 'row',
      }}
    >
      {/* Error Message */}
      {error && (
        <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm ${errorColSpan}`}>
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && winners.length === 0 && (
        <div className={`flex items-center justify-center h-64 ${errorColSpan}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Children - Grid content */}
      {children}
      
      {/* Empty State - Logo */}
      {!loading && winners.length === 0 && !error && displayCount <= 0 && (
        <div className={`flex items-center justify-center h-full text-zinc-400 ${errorColSpan}`}>
          <img
            src="/images/Logonrh.png"
            alt="NR Sport Logo"
            className="w-[400px] opacity-10 mt-40 pointer-events-none select-none"
            style={{ zIndex: 0 }}
          />
        </div>
      )}
    </div>
  );
}

