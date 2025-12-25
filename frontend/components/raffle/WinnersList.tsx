'use client';

import { useState, useEffect, useRef } from 'react';
import { raffleApi, RaffleParticipant, Prize } from '@/lib/api/raffle';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { QRCodeSVG } from 'qrcode.react';

interface WinnersListProps {
  raffleEventId: number | null;
  refreshTrigger?: number; // Trigger refresh when this changes
  selectedPrize?: Prize | null; // Current selected prize to display
}

export default function WinnersList({ raffleEventId, refreshTrigger = 0, selectedPrize = null }: WinnersListProps) {
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const loadWinners = async () => {
    if (!raffleEventId) return;

    try {
      setLoading(true);
      
      // ดึงข้อมูลหลายหน้าจนกว่าจะได้ทั้งหมด
      // Backend จำกัด max_page_size = 100 ดังนั้นต้องดึงหลายหน้า
      let allWinners: RaffleParticipant[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100; // ใช้ max_page_size จาก backend

      while (hasMore) {
        const response = await raffleApi.listWinnersPublic({
          raffle_event: raffleEventId,
          page: currentPage,
          page_size: pageSize,
        });

        if (response.results && response.results.length > 0) {
          allWinners = [...allWinners, ...response.results];
          
          // ตรวจสอบว่ายังมีหน้าถัดไปหรือไม่
          hasMore = response.next !== null && response.next !== undefined;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      // Sort by selected_at descending (newest first) - คนล่าสุดอยู่บนสุด
      const sortedWinners = allWinners
        .sort((a, b) => new Date(b.selected_at).getTime() - new Date(a.selected_at).getTime());

      setWinners(sortedWinners);
    } catch (err) {
      console.error('Error loading winners:', err);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection - ใช้ WebSocket แทน polling
  const wsUrl = raffleEventId
    ? `${API_URL.replace('/api', '')}/ws/raffle/${raffleEventId}/`
    : '';

  const { isConnected, lastMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      // ฟังเฉพาะ winners_update เท่านั้น (ส่งจาก saveWinners API)
      // ไม่ฟัง raffle_result เพราะมันส่งตอน spin (ยังไม่บันทึก)
      if (message.type === 'winners_update') {
        // Update winners list when new winners are saved
        console.log('WebSocket: winners updated, reloading...');
        loadWinners();
      }
    },
  });

  // Load winners on mount and when raffleEventId or refreshTrigger changes
  useEffect(() => {
    if (raffleEventId) {
      loadWinners();
    }
  }, [raffleEventId, refreshTrigger]);

  // Use actual winners, no placeholder
  const displayWinners = winners;

  return (
    <div className='flex flex-col gap-3 col-span-1 m-4 h-screen'>
      <div className='flex flex-col bg-linear-to-r from-emerald-600 to-emerald-800 p-2 rounded-lg shadow border-emerald-300 border shrink-0'>
        <div className='bg-white/20 p-2 flex items-center rounded-lg mb-3'>
          <img
            src="/images/Logonrh.png"
            alt="โรงพยาบาลนางรอง Logo"
            className="h-10 mr-2"
          />
          <div>
            <h1 className="text-lg font-semibold">
              โรงพยาบาลนางรอง
            </h1>
            <h3 className='text-xs'>
              งานมอบแผนและนโยบาย ปี 2569 & จับสลากปีใหม่ 2568 [TEST]
            </h3>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2 justify-between items-center '>
          <div className='col-span-2 justify-center text-center  overflow-hidden'>
            <div className='border border-white rounded-sm mb-2 overflow-hidden'>
              <p className='bg-yellow-500 text-emerald-800 font-bold p-1'>
                {selectedPrize ? selectedPrize.name : 'รางวัลมูลค่า'}
              </p>
            </div>
            <div className='border border-white rounded-sm'>
              <p className='bg-white/20 p-1'>
                {selectedPrize ? `เหลือ ${selectedPrize.quantity - selectedPrize.selected_count} รางวัล` : 'เหลือ'}
              </p>
            </div>
          </div>
          <div className='bg-white w-full h-full rounded-2xl grid justify-center items-center mr-4 p-2'>
            {raffleEventId ? (
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/raffle/winners?raffle_event=${raffleEventId}`}
                size={80}
                level="H"
                includeMargin={false}
              />
            ) : (
              <p className='text-zinc-800 text-xs'>QR</p>
            )}
          </div>
        </div>
      </div>
      <div className='bg-gray-500 border-2 border-emerald-600 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0' style={{ marginBottom: '30px' }}>
        <div className='p-2 bg-linear-to-t from-emerald-500 to-emerald-700 text-center border-b-2 border-yellow-400 shrink-0'>
          รายชื่อผู้ได้รับรางวัล
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          {displayWinners.length > 0 ? (
            <table className="w-full text-zinc-800 table-fixed">
              <tbody>
                {displayWinners.map((winner, i) => (
                  <tr key={winner.id || i} className={i % 2 === 0 ? 'bg-gray-500' : 'bg-gray-800 '}>
                    <td className={`py-2 px-4 text-center text-white w-16 ${i % 2 === 0 ? 'border-r border-zinc-800 ' : 'border-r border-gray-500 '}`}>
                      {displayWinners.length - i}
                    </td>
                    <td className={`py-2 px-4 text-left text-white flex justify-between items-center`}>
                      <p>{winner.participant_name || '-'}</p>
                      <p>#{String(winner.participant || i + 1).padStart(3, '0')}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <p className="text-white text-lg">ยังไม่มีผู้ได้รับรางวัล</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

