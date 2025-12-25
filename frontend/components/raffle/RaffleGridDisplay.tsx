'use client';

import RaffleGrid1 from './RaffleGrid1';
import RaffleGrid2 from './RaffleGrid2';
import RaffleGrid3 from './RaffleGrid3';
import RaffleGrid4 from './RaffleGrid4';
import RaffleGrid5 from './RaffleGrid5';
import RaffleGrid6 from './RaffleGrid6';
import RaffleGrid7 from './RaffleGrid7';
import RaffleGrid8 from './RaffleGrid8';
import RaffleGrid9 from './RaffleGrid9';
import RaffleGrid10 from './RaffleGrid10';
import RaffleGrid20 from './RaffleGrid20';
import RaffleGridDefault from './RaffleGridDefault';
import { RaffleGridBaseProps } from './RaffleGridBase';

interface RaffleGridDisplayProps {
  displayCount: number;
  winners: any[];
  revealedWinners: any[];
  spinningCards: boolean[];
  error: string | null;
  loading: boolean;
  eventId?: number;
  textSize?: string; // Optional: override text size for all grids
  cardPadding?: string; // Optional: override card padding for all grids
}

export default function RaffleGridDisplay(props: RaffleGridDisplayProps) {
  const { displayCount, textSize, cardPadding, ...restProps } = props;
  
  // Convert to base props
  const baseProps: RaffleGridBaseProps = {
    ...restProps,
    gridCols: '', // Will be set by individual components
    gap: '', // Will be set by individual components
    children: undefined, // Children will be rendered by individual components
    textSize, // Pass textSize override if provided
    cardPadding, // Pass cardPadding override if provided
  };

  // Select component based on displayCount
  switch (displayCount) {
    case 1:
      return <RaffleGrid1 {...baseProps} />;
    case 2:
      return <RaffleGrid2 {...baseProps} />;
    case 3:
      return <RaffleGrid3 {...baseProps} />;
    case 4:
      return <RaffleGrid4 {...baseProps} />;
    case 5:
      return <RaffleGrid5 {...baseProps} />;
    case 6:
      return <RaffleGrid6 {...baseProps} />;
    case 7:
      return <RaffleGrid7 {...baseProps} />;
    case 8:
      return <RaffleGrid8 {...baseProps} />;
    case 9:
      return <RaffleGrid9 {...baseProps} />;
    case 10:
      return <RaffleGrid10 {...baseProps} />;
    case 20:
      return <RaffleGrid20 {...baseProps} />;
    default:
      return <RaffleGridDefault {...baseProps} displayCount={displayCount} />;
  }
}
