'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { raffleApi, RaffleParticipant, Prize } from '@/lib/api/raffle';
import WinnersTable from '@/components/raffle/WinnersTable';
import PublicFooter from '@/components/ui/PublicFooter';
import MobileNavBar from '@/components/ui/MobileNavBar';
import MobileHeader from '@/components/ui/MobileHeader';
import { Home, RefreshCw } from 'lucide-react';

export default function PublicWinnersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [raffleEventId, setRaffleEventId] = useState<number | null>(null);
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [prizeFilter, setPrizeFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [markedNames, setMarkedNames] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<{
    count: number;
    next?: string | null;
    previous?: string | null;
  } | null>(null);

  // Extract raffle_event from URL
  useEffect(() => {
    const raffleEventParam = searchParams.get('raffle_event');
    console.log('raffle_event param:', raffleEventParam);
    if (raffleEventParam) {
      const eventId = parseInt(raffleEventParam, 10);
      if (!isNaN(eventId) && eventId > 0) {
        setRaffleEventId(eventId);
        setError(''); // Clear error if valid
      } else {
        setError(`Invalid raffle_event parameter: "${raffleEventParam}". Must be a positive number.`);
        setRaffleEventId(null);
      }
    } else {
      setError('กรุณาระบุ raffle_event parameter ใน URL เช่น: ?raffle_event=1');
      setRaffleEventId(null);
    }
  }, [searchParams]);

  // Load favorite names from localStorage
  useEffect(() => {
    if (raffleEventId) {
      const storageKey = `raffle_favorites_${raffleEventId}`;
      // Try new key first, fallback to old key for backward compatibility
      let stored = localStorage.getItem(storageKey);
      if (!stored) {
        stored = localStorage.getItem(`raffle_winners_${raffleEventId}`);
        // Migrate to new key if old key exists
        if (stored) {
          localStorage.setItem(storageKey, stored);
          localStorage.removeItem(`raffle_winners_${raffleEventId}`);
        }
      }
      if (stored) {
        try {
          const names = JSON.parse(stored);
          setMarkedNames(new Set(Array.isArray(names) ? names : []));
        } catch (err) {
          console.error('Error parsing favorite names from localStorage:', err);
        }
      }
    }
  }, [raffleEventId]);

  // Load prizes when raffleEventId is available
  useEffect(() => {
    if (raffleEventId) {
      loadPrizes();
    }
  }, [raffleEventId]);

  // Load winners when parameters change
  useEffect(() => {
    if (raffleEventId) {
      loadWinners();
    }
  }, [raffleEventId, currentPage, search, prizeFilter]);

  const loadPrizes = async () => {
    if (!raffleEventId) return;

    try {
      const data = await raffleApi.listPrizesPublic(raffleEventId);
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading prizes:', err);
      setPrizes([]);
    }
  };

  const loadWinners = async () => {
    if (!raffleEventId) return;

    try {
      setLoading(true);
      setError('');

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

      const data = await raffleApi.listWinnersPublic(params);

      setWinners(data.results || []);
      setPagination({
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
      });
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
    setCurrentPage(1);
  };

  const handlePrizeFilterChange = (prizeId: number | null) => {
    setPrizeFilter(prizeId);
    setCurrentPage(1);
  };

  const handleMarkName = (name: string) => {
    if (!raffleEventId) return;

    const newMarkedNames = new Set(markedNames);
    if (newMarkedNames.has(name)) {
      newMarkedNames.delete(name);
    } else {
      newMarkedNames.add(name);
    }

    setMarkedNames(newMarkedNames);

    // Save to localStorage
    const storageKey = `raffle_favorites_${raffleEventId}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newMarkedNames)));
  };

  const handleRefresh = () => {
    if (raffleEventId) {
      loadWinners();
      loadPrizes();
    }
  };

  if (!raffleEventId) {
    return (
      <div className="min-h-screen bg-linear-to-t from-emerald-100/60 to-white  flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูล</h1>
          <p className="text-gray-600 mb-4">
            {error || 'กรุณาระบุ raffle_event parameter ใน URL'}
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-semibold mb-2">ตัวอย่าง URL:</p>
            <code className="text-xs text-gray-600 break-all">
              /raffle/winners?raffle_event=1
            </code>
          </div>
          {searchParams.toString() && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold mb-2">URL Parameters ที่ได้รับ:</p>
              <code className="text-xs text-gray-600 break-all">
                {searchParams.toString()}
              </code>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-t from-emerald-100/60 to-white flex flex-col pb-16 md:pb-0">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className='flex justify-between items-center '>
            <div className="flex gap-2 items-center mb-2">
              <div className="flex justify-center">
                <img
                  src="/images/Logonrh.png"
                  alt="NR Sport Logo"
                  className="h-16 md:h-20 w-auto"
                />
              </div>
              <div className='mb-2'>
                <h1 className="text-2xl font-bold text-emerald-700 mb-1">รายชื่อผู้ได้รับรางวัล</h1>
                <p className="text-sm text-gray-600">ค้นหาและเพิ่มชื่อของคุณเป็นรายการโปรดได้ที่นี่</p>
              </div>
            </div>
            <div className='hidden md:flex p-4 bg-white/50 border border-gray-100 shadow-lg rounded-full items-center gap-2'>
              <Link
                href="/"
                className="px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors flex items-center gap-2"
                title="กลับหน้าหลัก"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">หน้าหลัก</span>
              </Link>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
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
            markedNames={markedNames}
            onMarkName={handleMarkName}
            showMarkButton={true}
          />
        </div>
      </div>

      <PublicFooter />
      
      {/* Mobile Navigation Bar */}
      <MobileNavBar onRefresh={handleRefresh} showRefresh={true} />
    </div>
  );
}

