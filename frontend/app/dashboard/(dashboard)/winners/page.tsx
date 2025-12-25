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
  const [exporting, setExporting] = useState(false);
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
      if (data && typeof data === 'object' && 'results' in data && !Array.isArray(data)) {
        const paginatedData = data as { results: RaffleParticipant[]; count?: number; next?: string | null; previous?: string | null };
        setWinners(Array.isArray(paginatedData.results) ? paginatedData.results : []);
        setPagination({
          count: paginatedData.count || 0,
          next: paginatedData.next || null,
          previous: paginatedData.previous || null,
        });
      } else if (Array.isArray(data)) {
        // If API returns array directly (no pagination), show all results
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

  const handlePrintPDF = async () => {
    if (!selectedEvent) return;
    
    try {
      setExporting(true);
      
      // Get raffle events for this event
      const raffleEvents = await raffleApi.listEvents({ event: selectedEvent });
      if (raffleEvents.length === 0) {
        alert('ไม่พบข้อมูลการจับสลาก');
        return;
      }

      const raffleEventId = raffleEvents[0].id;
      const params: any = {
        raffle_event: raffleEventId,
      };

      if (search) {
        params.search = search;
      }

      if (prizeFilter) {
        params.prize = prizeFilter;
      }

      const htmlContent = await raffleApi.exportWinnersPDF(params);
      
      // Create new window with HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('กรุณาอนุญาตให้เปิด popup window');
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then show print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedEvent) return;
    
    try {
      setExporting(true);
      
      // Get raffle events for this event
      const raffleEvents = await raffleApi.listEvents({ event: selectedEvent });
      if (raffleEvents.length === 0) {
        alert('ไม่พบข้อมูลการจับสลาก');
        return;
      }

      const raffleEventId = raffleEvents[0].id;
      const params: any = {
        raffle_event: raffleEventId,
      };

      if (search) {
        params.search = search;
      }

      if (prizeFilter) {
        params.prize = prizeFilter;
      }

      const blob = await raffleApi.exportWinnersExcel(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `winners_${raffleEventId}_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting Excel:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
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

      {/* Prize Status Summary */}
      {prizes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะรางวัล</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize) => {
              const remaining = prize.quantity - prize.selected_count;
              const percentage = prize.quantity > 0 ? (prize.selected_count / prize.quantity) * 100 : 0;
              const isSelected = prizeFilter === prize.id;
              return (
                <button
                  key={prize.id}
                  onClick={() => handlePrizeFilterChange(prize.id)}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                      {prize.name}
                    </h4>
                    <span className={`text-sm font-semibold ${
                      remaining === 0 ? 'text-red-600' : remaining <= prize.quantity * 0.2 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      เหลือ {remaining}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ได้ไปแล้ว: {prize.selected_count}</span>
                      <span>ทั้งหมด: {prize.quantity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          remaining === 0 ? 'bg-red-500' : remaining <= prize.quantity * 0.2 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {percentage.toFixed(0)}% ครบแล้ว
                    </div>
                  </div>
                </button>
              );
            })}
            {/* "ดูทั้งหมด" Button */}
            {(() => {
              const totalSelected = prizes.reduce((sum, prize) => sum + prize.selected_count, 0);
              const totalQuantity = prizes.reduce((sum, prize) => sum + prize.quantity, 0);
              const totalRemaining = totalQuantity - totalSelected;
              const totalPercentage = totalQuantity > 0 ? (totalSelected / totalQuantity) * 100 : 0;
              const isSelected = prizeFilter === null;
              return (
                <button
                  onClick={() => handlePrizeFilterChange(null)}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                      ดูทั้งหมด
                    </h4>
                    <span className={`text-sm font-semibold ${
                      totalRemaining === 0 ? 'text-red-600' : totalRemaining <= totalQuantity * 0.2 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      เหลือ {totalRemaining}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ได้ไปแล้ว: {totalSelected}</span>
                      <span>ทั้งหมด: {totalQuantity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          totalRemaining === 0 ? 'bg-red-500' : totalRemaining <= totalQuantity * 0.2 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {totalPercentage.toFixed(0)}% ครบแล้ว
                    </div>
                  </div>
                </button>
              );
            })()}
          </div>
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
        onPrint={handlePrintPDF}
        onExportExcel={handleExportExcel}
        isExporting={exporting}
      />
    </div>
  );
}

