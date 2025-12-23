'use client';

import ParticipantsCard from '@/components/participants/ParticipantsCard';
import SpinningCard from '@/components/raffle/SpinningCard';
import EmptyCard from '@/components/raffle/EmptyCard';
import WinnersList from '@/components/raffle/WinnersList';
import SaveConfirmModal from '@/components/raffle/SaveConfirmModal';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
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

  // Fetch prizes when raffleEventId is available
  useEffect(() => {
    if (raffleEventId) {
      loadPrizes();
    }
  }, [raffleEventId]);

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

  // Update spinning cards when currentWinners changes
  useEffect(() => {
    if (currentWinners.length > 0) {
      setSpinningCards(Array(currentWinners.length).fill(false));
    }
  }, [currentWinners]);

  // Get available prizes (not completed)
  const availablePrizes = prizes.filter(p => p.selected_count < p.quantity);

  // Calculate grid columns based on displayCount
  const getGridColumns = (count: number): number => {
    if (count === 1) return 1; // grid-cols-1 (เต็มจอ)
    if (count === 2) return 2; // grid-cols-2
    return 3; // grid-cols-3 for 3+
  };

  const gridColumns = getGridColumns(displayCount);

  // Calculate text size based on displayCount
  const getTextSize = (count: number): string => {
    if (count >= 10 && count <= 12) return 'text-2xl/16';
    if (count >= 7 && count <= 9) return 'text-3xl/16';
    return 'text-5xl/16'; // default for 1-6
  };

  const textSize = getTextSize(displayCount);

  // Calculate empty cards count
  const totalCards = currentWinners.length;
  const totalSlots = Math.ceil(totalCards / gridColumns) * gridColumns;
  const emptyCardsCount = totalSlots - totalCards;

  const handleSpin = async () => {
    if (!selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }

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
        // Store winners and metadata for saving later
        setCurrentWinners(result.winners);
        setSelectedSeed(result.seed || '');
        setSelectedRuleSnapshot(result.rule_snapshot || {});
        setSelectedResult(result.result || {});
        
        // Start spinning animation
        setSpinningCards(Array(result.winners.length).fill(true));
        
        // Stop spinning after 2-3 seconds (random duration for each card)
        Array.from({ length: result.winners.length }, (_, index) => {
          const duration = 2000 + Math.random() * 1000; // 2-3 seconds
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = false;
              return newState;
            });
          }, duration);
        });

        // Reset isSpinning after all cards stop
        setTimeout(() => {
          setIsSpinning(false);
        }, 3500);
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
    if (!currentWinners || currentWinners.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async () => {
    if (!selectedPrize || !currentWinners || currentWinners.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      setIsSaveModalOpen(false);
      return;
    }

    if (!canSpinRaffle()) {
      setError('คุณไม่มีสิทธิ์์ในการบันทึกผลการจับสลาก');
      setIsSaveModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Extract participant IDs from winners
      const participantIds = currentWinners.map(w => w.id);
      
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
      setSelectedSeed('');
      setSelectedRuleSnapshot(null);
      setSelectedResult(null);
      setIsSaveModalOpen(false);
      
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
    if (!isNaN(count) && count > 0) {
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
    <div className="min-h-screen bg-linear-to-r/hsl from-emerald-700 to-sky-900 text-white">
      <div className="mx-auto grid grid-cols-4 h-screen">

        <div className='flex flex-col col-span-3 py-8 px-4 justify-between'>
          <div className='flex flex-col h-full mb-4'>
            {/* Header Test */}
            <div className=' mb-4 grid gap-1'>
              <div className='flex items-center'>
                <img
                  src="/images/Logonrh.png"
                  alt="โรงพยาบาลนางรอง Logo"
                  className="h-16 mr-4"
                />
                <div>
                  <h1 className="text-xl">
                    โรงพยาบาลนางรอง
                  </h1>
                  <h3 className='text-xs'>
                    งานมอบแผนและนโยบาย ปี 2569 & จับสลากปีใหม่ 2568
                  </h3>
                </div>
              </div>
              <div className='grid grid-cols-2 bg-white text-zinc-800 text-4xl font-bold text-center p-2 rounded-lg shadow-xl  items-center'>
                <div className='p-4 bg-emerald-200/50 border-l-2 border-y-2 border-emerald-600 rounded-l-lg'>
                  {selectedPrize?.name || 'รางวัล'}
                </div>
                {/* <div className='p-4 border-y-2 border-emerald-600'>
                  {selectedPrize?.rules?.value ? `มูลค่า ${selectedPrize.rules.value} บาท` : 'มูลค่า -'}
                </div> */}
                <div className='p-4 border-r-2 border-y-2 border-emerald-600 rounded-r-lg'>
                  {selectedPrize 
                    ? `เหลือ ${selectedPrize.quantity - selectedPrize.selected_count} รางวัล`
                    : 'จำนวน - รางวัล'}
                </div>
              </div>
            </div>
            <div className={`grid gap-4 text-center text-2xl h-full ${
              displayCount === 1 
                ? 'grid-cols-1' 
                : displayCount === 2 
                ? 'grid-cols-2' 
                : 'grid-cols-3'
            }`}>
              {error && (
                <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm ${
                  displayCount === 1 ? 'col-span-1' : displayCount === 2 ? 'col-span-2' : 'col-span-3'
                }`}>
                  {error}
                </div>
              )}
              
              {loading && currentWinners.length === 0 && (
                <div className={`flex items-center justify-center h-64 ${
                  displayCount === 1 ? 'col-span-1' : displayCount === 2 ? 'col-span-2' : 'col-span-3'
                }`}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Render SpinningCard ทั้งหมด */}
              {currentWinners.length > 0 && currentWinners.map((winner, idx) => (
                <SpinningCard
                  key={idx}
                  finalValue={winner.name || 'Unknown'}
                  isSpinning={spinningCards[idx] || false}
                  spinDuration={2000 + Math.random() * 1000}
                  textSize={textSize}
                />
              ))}

              {/* Render EmptyCard เพื่อเติมช่องว่างให้เต็ม grid */}
              {currentWinners.length > 0 && Array.from({ length: emptyCardsCount }, (_, idx) => (
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
                <div className={`flex items-center justify-center h-64 text-zinc-400 ${
                  displayCount === 1 ? 'col-span-1' : displayCount === 2 ? 'col-span-2' : 'col-span-3'
                }`}>
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
          <div className='bg-white grid grid-cols-3 gap-2 items-center text-zinc-800 p-2 rounded-xl'>
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
                  value={displayCount.toString()}
                  onChange={(e) => handleDisplayCountChange(e.target.value)}
                  className="w-full px-4 py-1  border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-zinc-800"
                  disabled={!selectedPrize}
                >
                  <option value="0">-- แสดงผล --</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2  h-full '>
              <button
                onClick={handleSpin}
                disabled={isSpinning || !selectedPrize || loading || !canSpinRaffle()}
                className='bg-amber-300 hover:bg-amber-400 border-amber-400 border-2 rounded-lg col-span-2 disabled:opacity-50 disabled:cursor-not-allowed'
                title={!canSpinRaffle() ? 'คุณไม่มีสิทธิ์์ในการจับสลาก' : ''}
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
    </div>
  );
}

