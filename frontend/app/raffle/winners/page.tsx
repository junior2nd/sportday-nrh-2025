'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { raffleApi, RaffleParticipant, Prize } from '@/lib/api/raffle';
import PublicFooter from '@/components/ui/PublicFooter';
import MobileNavBar from '@/components/ui/MobileNavBar';
import MobileHeader from '@/components/ui/MobileHeader';
import { Home, RefreshCw, Search, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PublicWinnersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [raffleEventId, setRaffleEventId] = useState<number | null>(null);
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(''); // สำหรับ input field
  const [search, setSearch] = useState(''); // สำหรับ query จริง
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

  // Load winners only when search is provided
  useEffect(() => {
    if (raffleEventId && search) {
      loadWinners();
    } else if (raffleEventId && !search) {
      setWinners([]);
      setPagination(null);
      setLoading(false);
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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    setSearchInput(searchValue);
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Search Bar - Main Focus */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  placeholder="ค้นหาด้วยชื่อ..."
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base sm:text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit(e as any);
                    }
                  }}
                  autoFocus
                />
                {(searchInput || search) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
              {prizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">กรองตามรางวัล (ไม่บังคับ)</label>
                  <select
                    value={prizeFilter || ''}
                    onChange={(e) => handlePrizeFilterChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                  >
                    <option value="">ทั้งหมด</option>
                    {prizes.map((prize) => (
                      <option key={prize.id} value={prize.id}>
                        {prize.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-base sm:text-lg font-semibold shadow-md"
                disabled={loading}
              >
                {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
              </button>
            </form>
          </div>

          {/* Search Results */}
          {search && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                  <p className="mt-4 text-gray-600">กำลังค้นหา...</p>
                </div>
              ) : winners.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">ไม่พบรายชื่อที่ค้นหา</p>
                  <p className="text-sm text-gray-500">ลองค้นหาด้วยชื่ออื่น</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-emerald-50 border-b border-gray-200">
                    <p className="text-sm text-emerald-700">
                      พบ <span className="font-semibold">{pagination?.count || winners.length}</span> รายการ
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {winners.map((winner) => {
                      const winnerName = winner.participant_name || winner.name || 'ไม่ระบุชื่อ';
                      const isMarked = markedNames.has(winnerName);
                      return (
                        <div
                          key={winner.id}
                          className="p-4 sm:p-6 hover:bg-emerald-50/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                  {winnerName}
                                </h3>
                                {isMarked && (
                                  <button
                                    onClick={() => handleMarkName(winnerName)}
                                    className="text-yellow-500 hover:text-yellow-600 transition-colors"
                                    title="ลบออกจากรายการโปรด"
                                  >
                                    <Star className="w-5 h-5 fill-current" />
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                {winner.participant_department && (
                                  <span>หน่วยงาน: <span className="font-medium">{winner.participant_department}</span></span>
                                )}
                                {winner.prize_name && (
                                  <span>รางวัล: <span className="font-medium text-emerald-700">{winner.prize_name}</span></span>
                                )}
                                {winner.selected_at && (
                                  <span>วันที่ได้รับ: <span className="font-medium">{new Date(winner.selected_at).toLocaleDateString('th-TH')}</span></span>
                                )}
                              </div>
                            </div>
                            {!isMarked && handleMarkName && (
                              <button
                                onClick={() => handleMarkName(winnerName)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-2"
                                title="เพิ่มเป็นรายการโปรด"
                              >
                                <Star className="w-4 h-4" />
                                <span className="hidden sm:inline">เพิ่มเป็นรายการโปรด</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.count > 20 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= Math.ceil(pagination.count / 20)}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ถัดไป
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            แสดง <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> ถึง{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * 20, pagination.count)}
                            </span>{' '}
                            จาก <span className="font-medium">{pagination.count}</span> รายการ
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              หน้า {currentPage} จาก {Math.ceil(pagination.count / 20)}
                            </span>
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= Math.ceil(pagination.count / 20)}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Empty State - No Search Yet */}
          {!search && !loading && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <Search className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">เริ่มค้นหารายชื่อผู้ได้รับรางวัล</h2>
              <p className="text-gray-500">กรุณาพิมพ์ชื่อที่ต้องการค้นหาในช่องค้นหาด้านบน</p>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
      
      {/* Mobile Navigation Bar */}
      <MobileNavBar onRefresh={handleRefresh} showRefresh={true} />
    </div>
  );
}

