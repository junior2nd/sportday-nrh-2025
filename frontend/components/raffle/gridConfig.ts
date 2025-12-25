/**
 * Grid Configuration for Raffle Display
 * 
 * ไฟล์นี้เก็บ grid config ทั้งหมดเพื่อให้แก้ไขได้ง่าย
 * แต่ละ displayCount มี config ของตัวเอง
 */

export interface GridConfig {
  gridCols: string;
  firstCardCols: string;
  otherCardsCols: string;
  textSize: string;
  cardPadding: string;
  gap: string;
  minCardHeight?: string; // เพิ่ม min-height สำหรับ responsive
}

export const gridConfigs: Record<number, GridConfig> = {
  1: {
    gridCols: 'grid-cols-1',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-6xl', // ตัวอย่าง: สามารถ override ได้โดยส่ง textSize prop เช่น textSize="text-5xl"
    cardPadding: 'p-6',
    gap: 'gap-2',
    minCardHeight: 'min-h-[300px]',
  },
  2: {
    gridCols: 'grid-cols-2',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-4xl',
    cardPadding: 'p-3',
    gap: 'gap-2',
    minCardHeight: 'min-h-[250px]',
  },
  3: {
    gridCols: 'grid-cols-3',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-3xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[200px]',
  },
  4: {
    gridCols: 'grid-cols-2',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-3xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[200px]',
  },
  5: {
    gridCols: 'grid-cols-3',
    firstCardCols: 'col-span-2',
    otherCardsCols: 'col-span-1',
    textSize: 'text-3xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[200px]',
  },
  6: {
    gridCols: 'grid-cols-3',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-2xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[180px]',
  },
  7: {
    gridCols: 'grid-cols-4',
    firstCardCols: 'col-span-4',
    otherCardsCols: 'col-span-1',
    textSize: 'text-2xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[150px]',
  },
  8: {
    gridCols: 'grid-cols-4',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-xl',
    cardPadding: 'p-1.5',
    gap: 'gap-2',
    minCardHeight: 'min-h-[150px]',
  },
  9: {
    gridCols: 'grid-cols-6',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-sm',
    cardPadding: 'p-1',
    gap: 'gap-2',
    minCardHeight: 'min-h-[120px]',
  },
  10: {
    gridCols: 'grid-cols-5',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-xl',
    cardPadding: 'p-2',
    gap: 'gap-1',
    minCardHeight: 'min-h-[150px]',
  },
  20: {
    gridCols: 'grid-cols-5',
    firstCardCols: 'col-span-1',
    otherCardsCols: 'col-span-1',
    textSize: 'text-xl',
    cardPadding: 'p-2',
    gap: 'gap-2',
    minCardHeight: 'min-h-[120px]',
  },
};

// Default config สำหรับ displayCount อื่นๆ
export const defaultGridConfig: GridConfig = {
  gridCols: 'grid-cols-6',
  firstCardCols: 'col-span-1',
  otherCardsCols: 'col-span-1',
  textSize: 'text-base',
  cardPadding: 'p-1',
  gap: 'gap-2',
  minCardHeight: 'min-h-[100px]',
};

/**
 * คำนวณ empty cards สำหรับแต่ละ displayCount
 */
export function calculateEmptyCards(cardCount: number, config: GridConfig): number {
  if (cardCount === 0) return 0;
  
  const cols = parseInt(config.gridCols.replace('grid-cols-', ''));
  
  // สำหรับกรณีพิเศษ (5, 7) ที่มี firstCardCols ต่างกัน
  if (cardCount === 5) {
    // grid-cols-3, first card = col-span-2, others = col-span-1
    // Layout: [Card1 (span 2)] [Card2] [Card3] [Card4] [Card5]
    // Row 1: Card1 (2 cols) + Card2 (1 col) = 3 cols เต็ม
    // Row 2: Card3, Card4, Card5 (3 cols) เต็ม
    // ไม่มี empty cards เพราะเต็มแล้ว
    return 0;
  } else if (cardCount === 7) {
    // grid-cols-4, first card = col-span-4, others = col-span-1
    // Layout: [Card1 (span 4)] [Card2] [Card3] [Card4] [Card5] [Card6] [Card7]
    // Row 1: Card1 (4 cols) เต็ม
    // Row 2: Card2, Card3, Card4 (3 cols) -> ต้องการ 1 empty
    // Row 3: Card5, Card6, Card7 (3 cols) -> ต้องการ 1 empty
    // Total empty = 2
    return 2;
  } else {
    // กรณีปกติ - คำนวณให้เต็ม grid เสมอ
    // คำนวณจำนวน rows ที่ต้องการ
    const rows = Math.ceil(cardCount / cols);
    const totalSlots = rows * cols;
    const emptyCount = totalSlots - cardCount;
    return Math.max(0, emptyCount);
  }
}

