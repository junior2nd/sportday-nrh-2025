'use client';

import { useState, useEffect, useRef } from 'react';
import { raffleApi, RaffleParticipant } from '@/lib/api/raffle';

interface WinnersListProps {
  raffleEventId: number | null;
  refreshTrigger?: number; // Trigger refresh when this changes
}

export default function WinnersList({ raffleEventId, refreshTrigger = 0 }: WinnersListProps) {
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadWinners = async () => {
    if (!raffleEventId) return;

    try {
      setLoading(true);
      const response = await raffleApi.listWinnersPublic({
        raffle_event: raffleEventId,
        page: 1,
        page_size: 14, // Get latest 14 winners
      });
      
      // Sort by selected_at descending (newest first) and take first 14
      const sortedWinners = response.results
        .sort((a, b) => new Date(b.selected_at).getTime() - new Date(a.selected_at).getTime())
        .slice(0, 14);
      
      setWinners(sortedWinners);
    } catch (err) {
      console.error('Error loading winners:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load winners on mount and when raffleEventId or refreshTrigger changes
  useEffect(() => {
    if (raffleEventId) {
      loadWinners();
    }
  }, [raffleEventId, refreshTrigger]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (raffleEventId) {
      intervalRef.current = setInterval(() => {
        loadWinners();
      }, 3000); // Refresh every 3 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [raffleEventId]);

  // Use actual winners, no placeholder
  const displayWinners = winners;

  return (
    <div className='flex flex-col gap-3 col-span-1 m-4'>
      <div className='flex justify-between bg-linear-to-r from-emerald-600 to-emerald-800 p-2 rounded-lg shadow border-emerald-300 border'>
        <div className='grid justify-between items-end'>
          <img
            src="/images/prize-gold.png"
            alt="Prize"
            className="absolute right-32 mr-1 w-52 h-36 object-contain pointer-events-none select-none"
            style={{ zIndex: 10 }}
          />
          <p className='text-white pl-4'>ดูผลการประกาศรางวัล</p>
        </div>
        <div className='bg-white h-25 w-25 rounded-2xl grid justify-center items-center'>
          <p className='text-zinc-800'>QR</p>
        </div>
      </div>
      <div className='bg-gray-500 h-full border-2 border-emerald-600 rounded-b-xl'>
        <div className='p-2 bg-linear-to-t from-emerald-500 to-emerald-600 text-center border-b-2 border-yellow-400'>
          รายชื่อผู้ได้รับรางวัล
        </div>
        <div className=" ">
          {displayWinners.length > 0 ? (
            <table className="w-full  text-zinc-800 table-fixed">
              <tbody>
                {displayWinners.map((winner, i) => (
                  <tr key={winner.id || i} className={i % 2 === 0 ? 'bg-gray-500' : 'bg-gray-800 '}>
                    <td className={`py-2 px-4 text-center text-white w-16 ${i % 2 === 0 ? 'border-r border-zinc-800 ' : 'border-r border-gray-500 '}`}>
                      {i + 1}
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

