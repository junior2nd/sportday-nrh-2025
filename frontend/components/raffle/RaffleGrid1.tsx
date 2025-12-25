'use client';

import { useMemo } from 'react';
import SlotMachineCard from './SlotMachineCard';
import EmptyCard from './EmptyCard';
import RaffleGridBase, { RaffleGridBaseProps } from './RaffleGridBase';
import { gridConfigs, calculateEmptyCards } from './gridConfig';

/**
 * RaffleGrid1 Component
 * 
 * ตัวอย่างการใช้งาน:
 * <RaffleGrid1 
 *   textSize="text-6xl"  // Override ขนาด font (default: text-6xl จาก gridConfig)
 *   cardPadding="p-8"    // Override padding (default: p-6 จาก gridConfig)
 *   {...otherProps}
 * />
 * 
 * หรือผ่าน RaffleGridDisplay:
 * <RaffleGridDisplay 
 *   displayCount={1}
 *   textSize="text-6xl"
 *   cardPadding="p-8"
 *   {...otherProps}
 * />
 */
export default function RaffleGrid1(props: RaffleGridBaseProps) {
  const { winners, revealedWinners, spinningCards, loading, error, eventId, textSize: overrideTextSize, cardPadding: overrideCardPadding } = props;
  
  const gridConfig = gridConfigs[1];
  
  // ใช้ override ถ้ามี ถ้าไม่มีใช้จาก config
  // ตัวอย่าง: textSize="text-6xl" จะ override ค่า default จาก gridConfig
  const textSize = overrideTextSize || gridConfig.textSize;
  const cardPadding = overrideCardPadding || gridConfig.cardPadding;

  // คำนวณ winners สำหรับแสดงผล
  const winnersForDisplay = useMemo(() => {
    return winners.length > 0 ? winners : revealedWinners;
  }, [winners, revealedWinners]);

  // คำนวณ empty cards
  const emptyCardsCount = useMemo(() => {
    if (winnersForDisplay.length > 0) {
      return calculateEmptyCards(winnersForDisplay.length, gridConfig);
    }
    return 0;
  }, [winnersForDisplay.length, gridConfig]);

  // คำนวณเวลาหมุน
  const spinDuration = 5000; // 5 วินาทีสำหรับ displayCount = 1

  return (
    <RaffleGridBase
      {...props}
      gridCols={gridConfig.gridCols}
      gap={gridConfig.gap}
      displayCount={1}
    >
      {/* Render SlotMachineCard */}
      {winnersForDisplay.length > 0 && winnersForDisplay.map((winner, idx) => {
        const colSpan = idx === 0 ? gridConfig.firstCardCols : gridConfig.otherCardsCols;
        const revealedWinner = revealedWinners[idx];
        const finalValue = revealedWinner ? (revealedWinner.name || 'Unknown') : undefined;
        
        return (
          <SlotMachineCard
            key={idx}
            finalValue={finalValue}
            isSpinning={spinningCards[idx] || false}
            spinDuration={spinDuration}
            eventId={eventId}
            className={`${colSpan} ${gridConfig.minCardHeight || ''}`}
            textSize={textSize}
            cardPadding={cardPadding}
          />
        );
      })}

      {/* Render EmptyCard เพื่อเติมช่องว่าง */}
      {winnersForDisplay.length > 0 && Array.from({ length: emptyCardsCount }, (_, idx) => (
        <EmptyCard
          key={`empty-${idx}`}
          text="EMPTY"
          borderColor="border-gray-200/20"
          className={gridConfig.minCardHeight || ''}
        />
      ))}

      {/* Show empty cards when displayCount is selected but no winners yet */}
      {!loading && winners.length === 0 && !error && (
        <EmptyCard
          key="empty-placeholder-0"
          text="EMPTY"
          borderColor="border-gray-200/20"
          className={gridConfig.minCardHeight || ''}
        />
      )}
    </RaffleGridBase>
  );
}

