'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { raffleApi, RaffleParticipant, Prize } from '@/lib/api/raffle';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import WinnersTable from '@/components/raffle/WinnersTable';

export default function WinnersPage() {
  const pathname = usePathname();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [prizeFilter, setPrizeFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    count: number;
    next?: string | null;
    previous?: string | null;
  } | null>(null);

  useEffect(() => {
    setHeader(
      'รายชื่อผู้ได้รับรางวัล',
      'ดูรายชื่อผู้ที่ได้รับรางวัลจากการจับสลาก'
    );
  }, [pathname, setHeader]);

  useEffect(() => {
    if (selectedEvent) {
      loadPrizes();
      loadWinners();
    } else {
      setWinners([]);
      setPrizes([]);
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      loadWinners();
    }
  }, [currentPage, search, prizeFilter, selectedEvent]);

  const loadPrizes = async () => {
    if (!selectedEvent) return;
    
    try {
      // Get raffle events for this event
      const raffleEvents = await raffleApi.listEvents({ event: selectedEvent });
      if (raffleEvents.length > 0) {
        // Get prizes for the first raffle event
        const prizesData = await raffleApi.listPrizes({ raffle_event: raffleEvents[0].id });
        setPrizes(Array.isArray(prizesData) ? prizesData : []);
      }
    } catch (err) {
      console.error('Error loading prizes:', err);
      setPrizes([]);
    }
  };

  const loadWinners = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      setError('');

      // Get raffle events for this event
      const raffleEvents = await raffleApi.listEvents({ event: selectedEvent });
      if (raffleEvents.length === 0) {
        setWinners([]);
        setPagination(null);
        return;
      }

      const raffleEventId = raffleEvents[0].id;
      const params: any = {
        raffle_event: raffleEventId,
        page: currentPage,
        page_size: 20,
      };

      if (search) {
        params.search = search;
      }

      if (prizeFilter) {
        params.prize = prizeFilter;
      }

      const data = await raffleApi.listWinners(params);
      
      // Handle paginated response
      if (data && typeof data === 'object' && 'results' in data) {
        setWinners(Array.isArray(data.results) ? data.results : []);
        setPagination({
          count: data.count || 0,
          next: data.next || null,
          previous: data.previous || null,
        });
      } else if (Array.isArray(data)) {
        setWinners(data);
        setPagination({
          count: data.length,
        });
      } else {
        setWinners([]);
        setPagination(null);
      }
    } catch (err: any) {
      console.error('Error loading winners:', err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
      setWinners([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePrizeFilterChange = (prizeId: number | null) => {
    setPrizeFilter(prizeId);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <WinnersTable
        winners={winners}
        loading={loading}
        pagination={
          pagination
            ? {
                ...pagination,
                currentPage,
                pageSize: 20,
              }
            : undefined
        }
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchValue={search}
        prizeFilter={prizeFilter}
        onPrizeFilterChange={handlePrizeFilterChange}
        availablePrizes={prizes.map((p) => ({ id: p.id, name: p.name }))}
        showMarkButton={false}
      />
    </div>
  );
}

