'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { raffleApi, Prize, RaffleEvent } from '@/lib/api/raffle';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import PrizeFormModal from '@/components/raffle/PrizeFormModal';
import PrizeDetailModal from '@/components/raffle/PrizeDetailModal';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import { Plus, Pencil, Trash2, Info, RotateCcw, Gift, Trophy, Package } from 'lucide-react';
import ResetConfirmModal from '@/components/raffle/ResetConfirmModal';

export default function PrizesPage() {
  const pathname = usePathname();
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [raffleEvents, setRaffleEvents] = useState<RaffleEvent[]>([]);
  const [selectedRaffleEvent, setSelectedRaffleEvent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    loadRaffleEvents();
  }, []);

  useEffect(() => {
    if (selectedRaffleEvent) {
      loadPrizes(selectedRaffleEvent);
    } else {
      setPrizes([]);
      setLoading(false);
    }
  }, [selectedRaffleEvent]);

  const handleCreate = useCallback(() => {
    setSelectedPrize(null);
    setIsFormModalOpen(true);
  }, []);

  const canCreateValue = canCreate();
  const canEditValue = canEdit();
  const actionButton = useMemo(() => {
    if (!selectedRaffleEvent) return undefined;
    
    return (
      <div className="flex items-center space-x-2">
        {canCreateValue && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>เพิ่มรางวัล</span>
          </button>
        )}
        {canEditValue && (
          <button
            onClick={() => setIsResetAllModalOpen(true)}
            className="px-4 py-2 bg-orange-600/20 text-orange-600 rounded-sm hover:bg-orange-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
          >
            <RotateCcw className="w-5 h-5" />
            <span>รีเซ็ตทั้งหมด</span>
          </button>
        )}
      </div>
    );
  }, [canCreateValue, canEditValue, selectedRaffleEvent, handleCreate]);

  const lastActionButtonDepsRef = useRef<{ canCreate: boolean; selectedRaffleEvent: number | null } | null>(null);

  useEffect(() => {
    // Update header when pathname changes or actionButton dependencies change
    const pathnameChanged = lastPathnameRef.current !== pathname;
    const currentDeps = { canCreate: canCreateValue, selectedRaffleEvent };
    const depsChanged = !lastActionButtonDepsRef.current || 
      lastActionButtonDepsRef.current.canCreate !== currentDeps.canCreate ||
      lastActionButtonDepsRef.current.selectedRaffleEvent !== currentDeps.selectedRaffleEvent;
    
    if (pathnameChanged || depsChanged) {
      if (pathnameChanged) {
        lastPathnameRef.current = pathname;
      }
      if (depsChanged) {
        lastActionButtonDepsRef.current = currentDeps;
      }
      setHeader(
        'รางวัล',
        'จัดการรางวัลสำหรับการจับสลาก',
        actionButton
      );
    }
    // Note: actionButton is intentionally NOT in dependencies to prevent infinite loops
    // We track its dependencies (canCreateValue, selectedRaffleEvent) separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setHeader, canCreateValue, selectedRaffleEvent]);

  const loadRaffleEvents = async () => {
    try {
      // Filter raffle events by selected event
      const data = await raffleApi.listEvents(selectedEvent ? { event: selectedEvent } : undefined);
      const raffleArray = Array.isArray(data) ? data : [];
      setRaffleEvents(raffleArray);
      // Auto-select first raffle event if available
      if (raffleArray.length > 0 && !selectedRaffleEvent) {
        setSelectedRaffleEvent(raffleArray[0].id);
      }
    } catch (err) {
      console.error('Error loading raffle events:', err);
      setRaffleEvents([]);
    }
  };

  // Reload raffle events when selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      loadRaffleEvents();
    } else {
      setRaffleEvents([]);
      setSelectedRaffleEvent(null);
    }
  }, [selectedEvent]);

  const loadPrizes = async (raffleEventId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await raffleApi.listPrizes({ raffle_event: raffleEventId });
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลรางวัลได้');
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsDeleteModalOpen(true);
  };

  const handleResetClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsResetModalOpen(true);
  };

  const handleReset = async (password: string) => {
    if (!selectedPrize) return;
    try {
      // Backend API requires reason with at least 10 characters
      // Format: password + description to meet validation requirement
      const reason = `Password confirmed: ${password} - Reset prize operation`;
      await raffleApi.resetPrize(selectedPrize.id, reason);
      if (selectedRaffleEvent) {
        loadPrizes(selectedRaffleEvent);
      }
    } catch (err: any) {
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleResetAll = async (password: string) => {
    if (!selectedRaffleEvent) return;
    try {
      // Backend API requires reason with at least 10 characters
      // Format: password + description to meet validation requirement
      const reason = `Password confirmed: ${password} - Reset all prizes operation`;
      await raffleApi.resetAllPrizes(selectedRaffleEvent, reason);
      loadPrizes(selectedRaffleEvent);
    } catch (err: any) {
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleViewDetail = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsDetailModalOpen(true);
  };

  const handleSave = async (prizeData: Partial<Prize>) => {
    try {
      if (selectedPrize) {
        await raffleApi.updatePrize(selectedPrize.id, prizeData);
      } else {
        await raffleApi.createPrize(prizeData);
      }
      if (selectedRaffleEvent) {
        loadPrizes(selectedRaffleEvent);
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async (reason: string) => {
    if (!selectedPrize) return;
    try {
      await raffleApi.deletePrize(selectedPrize.id, reason);
      if (selectedRaffleEvent) {
        loadPrizes(selectedRaffleEvent);
      }
    } catch (err: any) {
      throw err;
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

      {/* Raffle Event Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เลือกการจับสลาก
        </label>
        <select
          value={selectedRaffleEvent || ''}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedRaffleEvent(value ? Number(value) : null);
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- เลือกการจับสลาก --</option>
          {raffleEvents.map((raffle) => (
            <option key={raffle.id} value={raffle.id}>
              {raffle.name} ({raffle.event_name})
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Summary */}
      {selectedRaffleEvent && !loading && prizes.length > 0 && (() => {
        const totalQuantity = prizes.reduce((sum, prize) => sum + prize.quantity, 0);
        const totalSelected = prizes.reduce((sum, prize) => sum + (prize.selected_count || 0), 0);
        const totalRemaining = totalQuantity - totalSelected;
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">จำนวนรางวัลทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuantity}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ได้ไปแล้วทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalSelected}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">เหลืออีก</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalRemaining}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Prizes Table */}
      {!selectedRaffleEvent ? (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          กรุณาเลือกการจับสลากเพื่อดูรางวัล
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รอบที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อรางวัล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ได้รับ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prizes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    ยังไม่มีรางวัลสำหรับการจับสลากนี้
                  </td>
                </tr>
              ) : (
                prizes.map((prize) => (
                  <tr key={prize.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prize.round_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(prize)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        {prize.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prize.quantity} รางวัล
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prize.selected_count || 0} / {prize.quantity} คน
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(prize)}
                        className="text-emerald-600 hover:text-emerald-700 p-2 font-medium inline-flex items-center bg-emerald-600/10 hover:bg-emerald-600/30 rounded-sm mr-2"
                        title="ดูรายละเอียด"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      {canEdit() && (
                        <>
                          <button
                            onClick={() => handleEdit(prize)}
                            className="text-yellow-600 hover:text-yellow-700 p-2 font-medium inline-flex items-center bg-yellow-600/10 hover:bg-yellow-600/30 rounded-sm mr-2"
                            title="แก้ไข"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleResetClick(prize)}
                            className="text-orange-600 hover:text-orange-700 p-2 font-medium inline-flex items-center bg-orange-600/10 hover:bg-orange-600/30 rounded-sm mr-2"
                            title="รีเซ็ตรางวัล"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          {canDelete() && (
                            <button
                              onClick={() => handleDeleteClick(prize)}
                              className="text-red-600 hover:text-red-700 p-2 font-medium inline-flex items-center bg-red-600/10 hover:bg-red-600/30 rounded-sm"
                              title="ลบ"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Prize Form Modal */}
      <PrizeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedPrize(null);
        }}
        onSave={handleSave}
        prize={selectedPrize}
        raffleEventId={selectedRaffleEvent}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPrize(null);
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบรางวัล"
        itemName={selectedPrize?.name || ''}
      />

      {/* Reset Confirm Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setSelectedPrize(null);
        }}
        onConfirm={handleReset}
        title="ยืนยันการรีเซ็ตรางวัล"
        itemName={selectedPrize?.name || ''}
        isResetAll={false}
      />

      {/* Reset All Confirm Modal */}
      <ResetConfirmModal
        isOpen={isResetAllModalOpen}
        onClose={() => {
          setIsResetAllModalOpen(false);
        }}
        onConfirm={handleResetAll}
        title="ยืนยันการรีเซ็ตรางวัลทั้งหมด"
        isResetAll={true}
      />

      {/* Prize Detail Modal */}
      <PrizeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPrize(null);
        }}
        prize={selectedPrize}
      />
    </div>
  );
}

