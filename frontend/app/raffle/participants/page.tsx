'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { teamsApi, Participant } from '@/lib/api/teams';
import PublicFooter from '@/components/ui/PublicFooter';
import MobileNavBar from '@/components/ui/MobileNavBar';
import MobileHeader from '@/components/ui/MobileHeader';
import { Home, RefreshCw, Search, X, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ParticipantsPage() {
  const searchParams = useSearchParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(''); // สำหรับ input field
  const [searchQuery, setSearchQuery] = useState(''); // สำหรับ query จริง
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    count: number;
    next?: string | null;
    previous?: string | null;
  } | null>(null);

  const pageSize = 20;

  const loadParticipants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const eventParam = searchParams.get('event');
      const eventId = eventParam ? parseInt(eventParam, 10) : undefined;

      const params: any = {
        page: currentPage,
        page_size: pageSize,
        ordering: 'hospital_id', // เรียงตาม ID โรงพยาบาล
      };

      if (eventId) {
        params.event = eventId;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await teamsApi.listParticipants(params);

      if (response && typeof response === 'object' && 'results' in response) {
        setParticipants(response.results);
        setPagination({
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
        });
      } else if (Array.isArray(response)) {
        setParticipants(response);
        setPagination({
          count: response.length,
          next: null,
          previous: null,
        });
      } else {
        setParticipants([]);
        setPagination(null);
      }
    } catch (err: any) {
      console.error('Error loading participants:', err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้');
      setParticipants([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage, searchQuery]);

  // Load participants when component mounts or when page/searchQuery changes
  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim()); // ตั้งค่า searchQuery เมื่อกดค้นหา
    setCurrentPage(1); // รีเซ็ตไปหน้าแรก
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery(''); // ล้าง searchQuery ด้วย
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadParticipants();
  };

  const totalPages = pagination ? Math.ceil(pagination.count / pageSize) : 1;

  return (
    <div className="min-h-screen bg-linear-to-t from-emerald-100/60 to-white flex flex-col pb-16 md:pb-0">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2'>
            <div className="flex gap-2 items-center">
              <div className="flex justify-center">
                <img
                  src="/images/Logonrh.png"
                  alt="NR Sport Logo"
                  className="h-16 md:h-20 w-auto"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-1">ตรวจสอบรายชื่อผู้ลงทะเบียน</h1>
                <p className="text-sm sm:text-base text-gray-600">ค้นหารายชื่อผู้ลงทะเบียนเข้าร่วมงานจับสลากปีใหม่ 2569</p>
              </div>
            </div>
            <div className='hidden md:flex p-2 sm:p-4 bg-white/50 border border-gray-100 shadow-lg rounded-full items-center gap-2'>
              <Link
                href="/"
                className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                title="กลับหน้าหลัก"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">หน้าหลัก</span>
              </Link>
              <button
                onClick={handleRefresh}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-full shadow-lg border border-gray-100 p-4 px-6 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  placeholder="ค้นหาด้วยชื่อ..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit(e as any);
                    }
                  }}
                />
                {(searchInput || searchQuery) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm sm:text-base"
              >
                ค้นหา
              </button>
            </form>
          </div>

          {/* Participants Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">ไม่พบรายชื่อผู้ลงทะเบียน</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                          ลำดับ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                          ชื่อ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                          แผนก
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                          สถานะสิทธิ์
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant, index) => (
                        <tr
                          key={participant.id}
                          className="hover:bg-emerald-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-emerald-700">
                            {participant.hospital_id || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {participant.department_name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {participant.is_raffle_eligible ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" />
                                มีสิทธิ์์
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <XCircle className="w-4 h-4" />
                                ไม่มีสิทธิ์์
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.count > pageSize && (
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
                        disabled={currentPage >= totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ถัดไป
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          แสดง <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> ถึง{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * pageSize, pagination.count)}
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
                            หน้า {currentPage} จาก {totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
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
        </div>
      </div>

      <PublicFooter />
      
      {/* Mobile Navigation Bar */}
      <MobileNavBar onRefresh={handleRefresh} showRefresh={true} />
    </div>
  );
}

