'use client';

import ParticipantsCard from '@/components/participants/ParticipantsCard';
import SlotMachineCard from '@/components/raffle/SlotMachineCard';
import EmptyCard from '@/components/raffle/EmptyCard';
import WinnersList from '@/components/raffle/WinnersList';
import SaveConfirmModal from '@/components/raffle/SaveConfirmModal';
import SpinConfirmModal from '@/components/raffle/SpinConfirmModal';
import { Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { raffleApi, Prize } from '@/lib/api/raffle';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';

/**
 * หน้าประกาศรางวัล (Public Page)
 * 
 * หน้าที่:
 * - แสดงผลการจับสลากแบบเรียลไทม์
 * - ใช้ WebSocket เพื่ออัปเดตผลแบบทันที
 * - แสดงผลแบบ Fullscreen สำหรับ Projector
 * - ไม่ต้อง Login
 * 
 * Features:
 * - แสดงรายชื่อผู้ชนะรางวัลแต่ละรอบ
 * - แสดงผลแบบ Animation เมื่อมีการจับสลากใหม่
 * - รองรับ Dark Mode สำหรับ Projector
 */
export default function RaffleDisplayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
  const { canSpinRaffle } = useRole();
  
  // State management
  const [raffleEventId, setRaffleEventId] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(1);
  const [currentWinners, setCurrentWinners] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCards, setSpinningCards] = useState<boolean[]>([]);
  const [revealedWinners, setRevealedWinners] = useState<any[]>([]); // เก็บ winners ที่จะแสดงผลหลังจาก animation เสร็จ
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string>('');
  const [selectedRuleSnapshot, setSelectedRuleSnapshot] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/dashboard/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Extract raffle_event from URL
  useEffect(() => {
    const raffleEventParam = searchParams.get('raffle_event');
    if (raffleEventParam) {
      const eventId = parseInt(raffleEventParam, 10);
      if (!isNaN(eventId)) {
        setRaffleEventId(eventId);
      } else {
        setError('Invalid raffle_event parameter');
      }
    } else {
      setError('raffle_event parameter is required');
    }
  }, [searchParams]);

  // State for event ID from raffle event
  const [eventId, setEventId] = useState<number | undefined>(undefined);

  // Fetch prizes when raffleEventId is available
  useEffect(() => {
    if (raffleEventId) {
      loadRaffleEvent();
      loadPrizes();
    }
  }, [raffleEventId]);

  const loadRaffleEvent = async () => {
    if (!raffleEventId) return;
    
    try {
      const raffleEvent = await raffleApi.getEvent(raffleEventId);
      // RaffleEvent has 'event' field which is the event ID (number)
      if (raffleEvent.event) {
        setEventId(raffleEvent.event);
      }
    } catch (err: any) {
      console.error('Error loading raffle event:', err);
    }
  };

  const loadPrizes = async () => {
    if (!raffleEventId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await raffleApi.listPrizesPublic(raffleEventId);
      setPrizes(data);
    } catch (err: any) {
      console.error('Error loading prizes:', err);
      setError(err.response?.data?.error || 'Failed to load prizes');
    } finally {
      setLoading(false);
    }
  };

  // Update spinning cards when currentWinners changes - only reset if not currently spinning
  useEffect(() => {
    if (currentWinners.length > 0 && !isSpinning) {
      // Reset spinning cards only when not spinning and winners changed
      setSpinningCards(prev => {
        // ถ้า length เปลี่ยนให้ reset
        if (prev.length !== currentWinners.length) {
          return Array(currentWinners.length).fill(false);
        }
        return prev;
      });
    } else if (currentWinners.length === 0) {
      // Reset เมื่อไม่มี winners
      setSpinningCards([]);
    }
  }, [currentWinners.length, isSpinning]);

  // Get available prizes (not completed)
  const availablePrizes = prizes.filter(p => p.selected_count < p.quantity);

  // Grid layout configuration - แยก config เพื่อแก้ไขง่าย
  // ปรับ padding และ font size ให้พอดีกับจอเดียว
  const getGridConfig = (count: number) => {
    if (count === 1) {
      return {
        gridCols: 'grid-cols-1',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-4xl', // ขนาด font สำหรับจอ 1
        cardPadding: 'p-6', // padding สำหรับจอ 1
        maxHeight: '', // ไม่จำกัดความสูง - ให้ใช้พื้นที่ที่เหลือ
      };
    } else if (count === 2) {
      return {
        gridCols: 'grid-cols-2',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-4xl',
        cardPadding: 'p-3',
      };
    } else if (count === 3) {
      return {
        gridCols: 'grid-cols-3',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-3xl',
        cardPadding: 'p-2',
        maxHeight: '',
      };
    } else if (count === 4) {
      // แก้ไข: ใช้ grid-cols-2 และให้แต่ละ card ใช้ col-span-1 ปกติ (2x2 grid)
      return {
        gridCols: 'grid-cols-2',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-3xl',
        cardPadding: 'p-2',
        maxHeight: '',
      };
    } else if (count === 5) {
      // แก้ไข: ใช้ grid-cols-3 แทน grid-cols-2 เพื่อให้พอดี
      // Layout: [Card1 (span 2)] [Card2] [Card3] [Card4] [Card5]
      return {
        gridCols: 'grid-cols-3', // เปลี่ยนเป็น 3 columns
        firstCardCols: 'col-span-2', // ป้ายแรก span 2 columns
        otherCardsCols: 'col-span-1', // ที่เหลือ 1 column
        textSize: 'text-3xl',
        cardPadding: 'p-2',
        maxHeight: '',
      };
    } else if (count === 6) {
      return {
        gridCols: 'grid-cols-3',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-2xl',
        cardPadding: 'p-2',
        maxHeight: '',
      };
    } else if (count === 7) {
      // แก้ไข: ใช้ grid-cols-4 แทน grid-cols-3 เพื่อให้พอดี
      // Layout: [Card1 (span 4)] [Card2] [Card3] [Card4] [Card5] [Card6] [Card7]
      return {
        gridCols: 'grid-cols-4', // เปลี่ยนเป็น 4 columns
        firstCardCols: 'col-span-4', // ป้ายแรก span 4 columns
        otherCardsCols: 'col-span-1', // ที่เหลือ 1 column
        textSize: 'text-2xl',
        cardPadding: 'p-2',
        maxHeight: '',
      };
    } else if (count === 8) {
      return {
        gridCols: 'grid-cols-4',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-xl',
        cardPadding: 'p-1.5',
        maxHeight: '',
      };
    } else if (count === 9) {
      return {
        gridCols: 'grid-cols-6',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-sm', // ลดขนาด font
        cardPadding: 'p-1',
        maxHeight: '',
      };
    } else if (count === 10) {
      return {
        gridCols: 'grid-cols-5', // เปลี่ยนเป็น 5 columns
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-base', // เพิ่มขนาด font เล็กน้อย
        cardPadding: 'p-2', // เพิ่ม padding เพื่อให้เต็มช่อง
        maxHeight: '',
      };
    } else if (count === 20) {
      return {
        gridCols: 'grid-cols-5', // เปลี่ยนเป็น 5 columns
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-base', // เพิ่มขนาด font เล็กน้อย
        cardPadding: 'p-2', // เพิ่ม padding เพื่อให้เต็มช่อง
        maxHeight: '',
      };
    } else {
      // 11 ขึ้นไป - ลด font เล็กลง
      return {
        gridCols: 'grid-cols-6',
        firstCardCols: 'col-span-1',
        otherCardsCols: 'col-span-1',
        textSize: 'text-base', // ลดขนาด font เล็กกว่า 10
        cardPadding: 'p-1',
        maxHeight: '',
      };
    }
  };

  const gridConfig = getGridConfig(displayCount);

  // Calculate empty cards count based on grid config
  // แบบง่ายๆ: คำนวณให้เต็ม grid เสมอ
  const calculateEmptyCards = (cardCount: number) => {
    if (cardCount === 0) return 0;
    
    const config = getGridConfig(cardCount);
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
  };

  // คำนวณ empty cards จาก currentWinners หรือ revealedWinners
  const winnersForDisplay = currentWinners.length > 0 ? currentWinners : revealedWinners;
  const emptyCardsCount = winnersForDisplay.length > 0 
    ? calculateEmptyCards(winnersForDisplay.length)
    : 0;

  const handleSpinClick = () => {
    if (!selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }
    setIsSpinModalOpen(true);
  };

  const handleSpin = async () => {
    if (!selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      setIsSpinModalOpen(false);
      return;
    }

    setIsSpinModalOpen(false);

    try {
      setLoading(true);
      setError(null);
      setIsSpinning(true);

      // Use displayCount as quantity (limit to available prizes)
      const availableQuantity = selectedPrize.quantity - selectedPrize.selected_count;
      const quantity = Math.min(displayCount, availableQuantity);

      // Call API to select winners (does not save)
      const result = await raffleApi.selectWinners(selectedPrize.id, quantity);
      
      if (result.success && result.winners) {
        // คำนวณเวลาหมุนตามจำนวนรายการที่แสดงผล (ปรับช้าลง 50%)
        // ถ้า displayCount = 1 → 5 วินาที (5000ms), ถ้ามากกว่า 1 → 3 วินาที (3000ms จาก 2000ms)
        const spinDuration = displayCount === 1 ? 5000 : 3000;
        
        // Store metadata for saving later (แต่ยังไม่แสดงผลลัพธ์)
        setSelectedSeed(result.seed || '');
        setSelectedRuleSnapshot(result.rule_snapshot || {});
        setSelectedResult(result.result || {});
        
        // อย่าแสดงผลลัพธ์ทันที - สร้าง placeholder winners สำหรับแสดง card (แต่ยังไม่แสดงชื่อจริง)
        const placeholderWinners = result.winners.map(() => ({ name: undefined }));
        setCurrentWinners(placeholderWinners); // ใช้ placeholder เพื่อแสดง card
        setRevealedWinners([]); // ล้าง revealed winners
        
        // Staggered animation - แต่ละ card เริ่มหมุนทีละตัว (delay 100ms ต่อ card)
        const staggerDelay = 100; // ระยะห่างระหว่างแต่ละ card (ms)
        
        // เริ่ม spinning animation แบบ staggered
        Array.from({ length: result.winners.length }, (_, index) => {
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * staggerDelay);
        });
        
        // Stop spinning after calculated duration for each card (รวม delay)
        Array.from({ length: result.winners.length }, (_, index) => {
          const cardStartDelay = index * staggerDelay;
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = false;
              return newState;
            });
          }, cardStartDelay + spinDuration);
        });

        // เปิดเผยผลลัพธ์หลังจาก animation เสร็จทั้งหมด
        const lastCardDelay = (result.winners.length - 1) * staggerDelay;
        setTimeout(() => {
          // แสดงผลลัพธ์หลังจาก animation เสร็จ
          setCurrentWinners(result.winners);
          setRevealedWinners(result.winners);
          setIsSpinning(false);
        }, lastCardDelay + spinDuration + 500);
      } else {
        setError(result.error || 'Failed to select winners');
        setIsSpinning(false);
      }
    } catch (err: any) {
      console.error('Error selecting winners:', err);
      setError(err.response?.data?.error || 'Failed to select winners');
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    // ใช้ revealedWinners หรือ currentWinners (ถ้า revealedWinners ยังไม่มี)
    const winnersToSave = revealedWinners.length > 0 ? revealedWinners : currentWinners;
    if (!winnersToSave || winnersToSave.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async () => {
    // ใช้ revealedWinners หรือ currentWinners (ถ้า revealedWinners ยังไม่มี)
    const winnersToSave = revealedWinners.length > 0 ? revealedWinners : currentWinners;
    
    if (!selectedPrize || !winnersToSave || winnersToSave.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      setIsSaveModalOpen(false);
      return;
    }

    if (!canSpinRaffle()) {
      setError('คุณได้รางวัลแล้วในการบันทึกผลการจับสลาก');
      setIsSaveModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Extract participant IDs from winners
      const participantIds = winnersToSave.map(w => w.id);
      
      // Call API to save winners
      await raffleApi.saveWinners(
        selectedPrize.id,
        participantIds,
        selectedSeed,
        selectedRuleSnapshot,
        selectedResult
      );
      
      // Refresh prize data to update dropdown
      await loadPrizes();
      
      // Refresh selectedPrize with fresh data from API (without full page refresh)
      if (selectedPrize) {
        try {
          const freshPrize = await raffleApi.getPrizePublic(selectedPrize.id);
          setSelectedPrize(freshPrize);
          
          // Check if prize is completed
          if (freshPrize.selected_count >= freshPrize.quantity) {
            // Remove from selection if completed
            setSelectedPrize(null);
          }
        } catch (err) {
          // If getPrizePublic fails, fallback to finding in prizes list
          const updatedPrize = prizes.find(p => p.id === selectedPrize.id);
          if (updatedPrize) {
            setSelectedPrize(updatedPrize);
            if (updatedPrize.selected_count >= updatedPrize.quantity) {
              setSelectedPrize(null);
            }
          }
        }
      }
      
      // Clear current winners and metadata
      setCurrentWinners([]);
      setRevealedWinners([]);
      setSelectedSeed('');
      setSelectedRuleSnapshot(null);
      setSelectedResult(null);
      setIsSaveModalOpen(false);
      
      // เคลียค่าทั้งหมดหลังบันทึก
      setDisplayCount(1);
      setSpinningCards([]);
      setIsSpinning(false);
      
      // Trigger WinnersList refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeChange = (prizeId: string) => {
    if (!prizeId) {
      setSelectedPrize(null);
      setCurrentWinners([]);
      return;
    }
    
    const prize = prizes.find(p => p.id === parseInt(prizeId, 10));
    if (prize) {
      setSelectedPrize(prize);
      setCurrentWinners([]);
    }
  };

  const handleDisplayCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0 && count <= 30) {
      setDisplayCount(count);
      // Clear current winners when changing display count
      setCurrentWinners([]);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-r/hsl from-emerald-700 to-sky-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    // <div className="min-h-screen bg-gradient-to-br from-zinc-900 from-10% via-zinc-900/90 via-50% to-zinc-900 to-90% text-white">
    <div className="min-h-screen bg-linear-to-r/hsl from-emerald-700 to-sky-900 text-white overflow-hidden">
      <div className="mx-auto grid grid-cols-4 h-screen max-h-screen">

        <div className='flex flex-col col-span-3 py-2 px-3 justify-between overflow-hidden'>
          <div className='flex flex-col flex-1 min-h-0'>
            {/* Header Test */}
            <div className='mb-2 flex justify-between gap-2 items-center shrink-0'>
              <div className='flex items-center'>
                <img
                  src="/images/Logonrh.png"
                  alt="โรงพยาบาลนางรอง Logo"
                  className="h-10 mr-2"
                />
                <div>
                  <h1 className="text-sm font-semibold">
                    โรงพยาบาลนางรอง
                  </h1>
                  <h3 className='text-xs'>
                    งานมอบแผนและนโยบาย ปี 2569 & จับสลากปีใหม่ 2568
                  </h3>
                </div>
              </div>
              {selectedPrize && (
                <div className='grid grid-cols-2 bg-white text-zinc-800 text-lg font-bold text-center p-1.5 rounded-lg shadow-xl items-center'>
                  <div className='p-2 bg-emerald-200/50 border-l-2 border-y-2 border-emerald-600 rounded-l-lg'>
                    {selectedPrize.name}
                  </div>
                  <div className='p-2 border-r-2 border-y-2 border-emerald-600 rounded-r-lg'>
                    {`เหลือ ${selectedPrize.quantity - selectedPrize.selected_count} รางวัล`}
                  </div>
                </div>
              )}
            </div>
            {/* Grid Container - กำหนดความสูง fix เพื่อไม่ให้บังปุ่ม */}
            <div className={`grid ${displayCount === 10 ? 'gap-1' : 'gap-2'} text-center ${displayCount === 1 ? 'flex-1 min-h-0' : 'h-[calc(100vh-200px)] overflow-auto'} ${gridConfig.gridCols}`}>
              {error && (
                <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm ${gridConfig.gridCols.replace('grid-cols-', 'col-span-')}`}>
                  {error}
                </div>
              )}
              
              {loading && currentWinners.length === 0 && (
                <div className={`flex items-center justify-center h-64 ${gridConfig.gridCols.replace('grid-cols-', 'col-span-')}`}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Render SlotMachineCard ทั้งหมด */}
              {/* แสดง card ตามจำนวน winners - ใช้ currentWinners สำหรับแสดง card, revealedWinners สำหรับชื่อจริง */}
              {winnersForDisplay.length > 0 && winnersForDisplay.map((winner, idx) => {
                // คำนวณเวลาหมุนตามจำนวนรายการที่แสดงผล (ปรับช้าลง 50%)
                // ถ้า displayCount = 1 → 5 วินาที (5000ms), ถ้ามากกว่า 1 → 3 วินาที (3000ms จาก 2000ms)
                const spinDuration = displayCount === 1 ? 5000 : 3000;
                
                // กำหนด col-span ตาม config
                const colSpan = idx === 0 ? gridConfig.firstCardCols : gridConfig.otherCardsCols;
                
                // ถ้ากำลัง spinning หรือยังไม่มี revealedWinners ให้ส่ง undefined เป็น finalValue (จะแสดง xxxxxxxx)
                // ถ้าเสร็จแล้ว (มี revealedWinners) ให้ส่งชื่อจริง
                const revealedWinner = revealedWinners[idx];
                const finalValue = revealedWinner ? (revealedWinner.name || 'Unknown') : undefined;
                
                return (
                  <SlotMachineCard
                    key={idx}
                    finalValue={finalValue}
                    isSpinning={spinningCards[idx] || false}
                    spinDuration={spinDuration}
                    eventId={eventId}
                    className={colSpan}
                    textSize={gridConfig.textSize}
                    cardPadding={gridConfig.cardPadding}
                  />
                );
              })}

              {/* Render EmptyCard เพื่อเติมช่องว่างให้เต็ม grid */}
              {winnersForDisplay.length > 0 && Array.from({ length: emptyCardsCount }, (_, idx) => (
                <EmptyCard
                  key={`empty-${idx}`}
                  text="EMPTY"
                  borderColor="border-gray-200/20"
                  className=""
                />
              ))}

              {/* Show empty cards when displayCount is selected but no winners yet */}
              {!loading && currentWinners.length === 0 && !error && displayCount > 0 && (
                Array.from({ length: displayCount }, (_, idx) => (
                  <EmptyCard
                    key={`empty-placeholder-${idx}`}
                    text="EMPTY"
                    borderColor="border-gray-200/20"
                    className=""
                  />
                ))
              )}
              
              {!loading && currentWinners.length === 0 && !error && displayCount <= 0 && (
                <div className={`flex items-center justify-center h-64 text-zinc-400 ${gridConfig.gridCols.replace('grid-cols-', 'col-span-')}`}>
                  <img
                    src="/images/Logonrh.png"
                    alt="NR Sport Logo"
                    className="w-[400px] opacity-10 mt-40 pointer-events-none select-none"
                    style={{ zIndex: 0 }}
                  />
                </div>
              )}
            </div>



          </div>
          <div className='bg-white grid grid-cols-3 gap-2 items-center text-zinc-800 p-1.5 rounded-xl shrink-0 relative z-50'>
            <div className='col-span-2 flex gap-2 items-center'>
              <div className="w-full grid grid-cols-3 gap-2">
                <select 
                  value={selectedPrize?.id.toString() || ''}
                  onChange={(e) => handlePrizeChange(e.target.value)}
                  className="w-full col-span-2 px-4 py-1  border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-zinc-800"
                  disabled={loading || availablePrizes.length === 0}
                >
                  <option value="">-- เลือกประเภทรางวัล --</option>
                  {availablePrizes.map((prize) => (
                    <option key={prize.id} value={prize.id.toString()}>
                      {prize.name} (เหลือ {prize.quantity - prize.selected_count} รางวัล)
                    </option>
                  ))}
                </select>
                <select
                  value={displayCount}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (!isNaN(numValue)) {
                      handleDisplayCountChange(numValue.toString());
                    }
                  }}
                  className="w-full px-4 py-1 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-zinc-800"
                  disabled={!selectedPrize}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2  h-full '>
              <button
                onClick={handleSpinClick}
                disabled={isSpinning || !selectedPrize || loading || !canSpinRaffle()}
                className='bg-amber-300 hover:bg-amber-400 border-amber-400 border-2 rounded-lg col-span-2 disabled:opacity-50 disabled:cursor-not-allowed'
                title={!canSpinRaffle() ? 'คุณได้รางวัลแล้วในการจับสลาก' : ''}
              >
                {isSpinning ? 'กำลังหมุน...' : 'Spin'}
              </button>
              <button 
                onClick={handleSaveClick}
                disabled={!currentWinners || currentWinners.length === 0 || loading}
                className='bg-blue-500 hover:bg-blue-400 border-blue-400 text-white border-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>

        {/* Right Component */}
        <WinnersList raffleEventId={raffleEventId} refreshTrigger={refreshTrigger} />
      </div>

      {/* Save Confirm Modal */}
      <SaveConfirmModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleSaveConfirm}
        winnerCount={currentWinners.length}
        prizeName={selectedPrize?.name}
        loading={loading}
      />

      {/* Spin Confirm Modal */}
      <SpinConfirmModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        onConfirm={handleSpin}
        prizeName={selectedPrize?.name}
        displayCount={displayCount}
        loading={loading || isSpinning}
      />
    </div>
  );
}

