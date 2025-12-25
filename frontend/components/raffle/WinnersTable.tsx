'use client';

import { useState, useEffect } from 'react';
import { RaffleParticipant } from '@/lib/api/raffle';
import { ChevronLeft, ChevronRight, Search, X, Printer, FileText } from 'lucide-react';

interface WinnersTableProps {
  winners: RaffleParticipant[];
  loading: boolean;
  pagination?: {
    count: number;
    next?: string | null;
    previous?: string | null;
    currentPage?: number;
    pageSize?: number;
  };
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  searchValue?: string;
  prizeFilter?: number | null;
  onPrizeFilterChange?: (prizeId: number | null) => void;
  availablePrizes?: Array<{ id: number; name: string }>;
  markedNames?: Set<string>;
  onMarkName?: (name: string) => void;
  showMarkButton?: boolean;
  onPrint?: () => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
}

export default function WinnersTable({
  winners,
  loading,
  pagination,
  onPageChange,
  onSearch,
  searchValue = '',
  prizeFilter,
  onPrizeFilterChange,
  availablePrizes = [],
  markedNames = new Set(),
  onMarkName,
  showMarkButton = false,
  onPrint,
  onExportExcel,
  isExporting = false,
}: WinnersTableProps) {
  const totalPages = pagination
    ? Math.ceil(pagination.count / (pagination.pageSize || 20))
    : 1;
  const currentPage = pagination?.currentPage || 1;

  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');

  // Sync local search value with prop when it changes externally
  useEffect(() => {
    if (searchValue !== undefined) {
      setLocalSearchValue(searchValue);
    }
  }, [searchValue]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearchValue);
    }
  };

  const handleMarkClick = (name: string) => {
    if (onMarkName) {
      onMarkName(name);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-full shadow-lg border border-gray-100 p-4 px-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 ">
          {/* Search */}
          {onSearch && (
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={localSearchValue}
                  onChange={handleSearchInputChange}
                  placeholder="ค้นหาชื่อ..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {localSearchValue && (
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
                className="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                ค้นหา
              </button>
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="พิมพ์/Preview PDF"
                >
                  <Printer className="w-5 h-5" />
                  <span>{isExporting ? 'กำลังสร้าง...' : 'พิมพ์/Preview'}</span>
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  disabled={isExporting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="บันทึกเป็น Excel"
                >
                  <FileText className="w-5 h-5" />
                  <span>{isExporting ? 'กำลังสร้าง...' : 'บันทึก Excel'}</span>
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : winners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            ไม่พบรายชื่อผู้ได้รับรางวัล
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อผู้ได้รับรางวัล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รางวัล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หน่วยงาน
                  </th>
                  {showMarkButton && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {winners
                  .sort((a, b) => {
                    // Sort: marked names first, then by selected_at (newest first)
                    const aMarked = markedNames.has(a.participant_name);
                    const bMarked = markedNames.has(b.participant_name);
                    if (aMarked && !bMarked) return -1;
                    if (!aMarked && bMarked) return 1;
                    // If both marked or both not marked, sort by date (newest first)
                    return new Date(b.selected_at).getTime() - new Date(a.selected_at).getTime();
                  })
                  .map((winner) => {
                  const isMarked = markedNames.has(winner.participant_name);
                  return (
                    <tr
                      key={winner.id}
                      className={`hover:bg-gray-50 ${isMarked ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {winner.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isMarked && (
                          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        )}
                        {winner.participant_name}
                      </td>
                      <td className="flex px-6 py-4 whitespace-nowrap text-sm text-gray-500 ">
                        <p className='bg-yellow-200 p-1 px-5 rounded-xl shadow-md text-zinc-800'>{winner.prize_name}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {winner.participant_department || '-'}
                      </td>
                      {showMarkButton && onMarkName && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => handleMarkClick(winner.participant_name)}
                            className={`px-3 py-1 rounded-sm text-xs font-medium ${
                              isMarked
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isMarked ? 'ยกเลิกรายการโปรด' : 'เพิ่มรายการโปรด'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.count > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  แสดง {((currentPage - 1) * (pagination.pageSize || 20)) + 1} ถึง{' '}
                  {Math.min(currentPage * (pagination.pageSize || 20), pagination.count)} จาก{' '}
                  {pagination.count} รายการ
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    ก่อนหน้า
                  </button>
                  <span className="text-sm text-gray-700">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    ถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

