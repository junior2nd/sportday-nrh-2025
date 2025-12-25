'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { RaffleEvent, Prize, RaffleParticipant, raffleApi } from '@/lib/api/raffle';
import { teamsApi, Participant } from '@/lib/api/teams';
import { Gift, Calendar, Building2, FileText, Package, Users, Plus, Pencil, Trash2, Info, UserPlus } from 'lucide-react';
import PrizeFormModal from './PrizeFormModal';
import PrizeDetailModal from './PrizeDetailModal';
import ParticipantSelectorModal from './ParticipantSelectorModal';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import { useRole } from '@/lib/hooks/useRole';

interface RaffleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: RaffleEvent | null;
}

type TabType = 'info' | 'prizes' | 'participants';

export default function RaffleDetailModal({ isOpen, onClose, raffle }: RaffleDetailModalProps) {
  const { canEdit, canDelete } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<RaffleParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPrizeFormOpen, setIsPrizeFormOpen] = useState(false);
  const [isPrizeDetailOpen, setIsPrizeDetailOpen] = useState(false);
  const [isParticipantSelectorOpen, setIsParticipantSelectorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && raffle) {
      if (activeTab === 'prizes') {
        loadPrizes();
      } else if (activeTab === 'participants') {
        loadParticipants();
        loadWinners();
      }
    }
  }, [isOpen, raffle, activeTab]);

  const loadPrizes = async () => {
    if (!raffle) return;
    try {
      setLoading(true);
      const data = await raffleApi.listPrizes({ raffle_event: raffle.id });
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading prizes:', err);
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!raffle) return;
    try {
      const data = await teamsApi.listParticipants({ event: raffle.event });
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading participants:', err);
      setParticipants([]);
    }
  };

  const loadWinners = async () => {
    if (!raffle) return;
    try {
      const data = await raffleApi.listWinners({ raffle_event: raffle.id });
      // Handle paginated response or direct array
      if (Array.isArray(data)) {
        setWinners(data);
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        setWinners(data.results);
      } else {
        setWinners([]);
      }
    } catch (err) {
      console.error('Error loading winners:', err);
      setWinners([]);
    }
  };

  const handleCreatePrize = () => {
    setSelectedPrize(null);
    setIsPrizeFormOpen(true);
  };

  const handleEditPrize = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeFormOpen(true);
  };

  const handleDeletePrize = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsDeleteModalOpen(true);
  };

  const handleViewPrizeDetail = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsPrizeDetailOpen(true);
  };

  const handleSavePrize = async (prizeData: Partial<Prize>) => {
    try {
      if (selectedPrize) {
        await raffleApi.updatePrize(selectedPrize.id, prizeData);
      } else {
        await raffleApi.createPrize(prizeData);
      }
      loadPrizes();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeletePrizeConfirm = async (reason: string) => {
    if (!selectedPrize) return;
    try {
      await raffleApi.deletePrize(selectedPrize.id, reason);
      loadPrizes();
    } catch (err: any) {
      throw err;
    }
  };

  const handleAddParticipants = (prize: Prize) => {
    const existingWinners = winners.filter(w => w.prize === prize.id).map(w => w.participant);
    setSelectedParticipantIds(existingWinners);
    setSelectedPrize(prize);
    setIsParticipantSelectorOpen(true);
  };

  const handleSaveParticipants = async (participantIds: number[]) => {
    if (!selectedPrize) return;
    try {
      await raffleApi.addParticipants(selectedPrize.id, participantIds);
      loadWinners();
      loadPrizes(); // Refresh to update selected_count
    } catch (err: any) {
      throw err;
    }
  };

  if (!raffle) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`รายละเอียดการจับสลาก: ${raffle.name}`}
        footer={
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            ปิด
          </button>
        }
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ข้อมูลทั่วไป
              </button>
              <button
                onClick={() => setActiveTab('prizes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prizes'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                รางวัล
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'participants'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ผู้มีสิทธิ์รับรางวัล
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Raffle Name */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{raffle.name}</h2>
                  <Gift className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              {/* Event Information */}
              <div>
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">กิจกรรม</h3>
                </div>
                <p className="text-gray-600">{raffle.event_name}</p>
              </div>

              {/* Organization */}
              <div>
                <div className="flex items-center mb-2">
                  <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">หน่วยงาน</h3>
                </div>
                <p className="text-gray-600">
                  {raffle.org_name ? (
                    <>
                      <span className="text-gray-400 bg-gray-100 text-sm px-3 rounded-lg mr-2">ID: {raffle.org}</span> {raffle.org_name}
                    </>
                  ) : (
                    `ID: ${raffle.org}`
                  )}
                </p>
              </div>

              {/* Description */}
              {raffle.description && (
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700">รายละเอียด</h3>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{raffle.description}</p>
                </div>
              )}

              {/* Rules */}
              {raffle.rules && Object.keys(raffle.rules).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700">กติกา</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(raffle.rules, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">รางวัล</h3>
                {canEdit() && (
                  <button
                    onClick={handleCreatePrize}
                    className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มรางวัล</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : prizes.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  ยังไม่มีรางวัล
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
                      {prizes.map((prize) => (
                        <tr key={prize.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prize.round_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewPrizeDetail(prize)}
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
                              onClick={() => handleViewPrizeDetail(prize)}
                              className="text-emerald-600 hover:text-emerald-700 p-2 font-medium inline-flex items-center bg-emerald-600/10 hover:bg-emerald-600/30 rounded-sm mr-2"
                              title="ดูรายละเอียด"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {canEdit() && (
                              <>
                                <button
                                  onClick={() => handleAddParticipants(prize)}
                                  className="text-blue-600 hover:text-blue-700 p-2 font-medium inline-flex items-center bg-blue-600/10 hover:bg-blue-600/30 rounded-sm mr-2"
                                  title="เพิ่มผู้มีสิทธิ์"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditPrize(prize)}
                                  className="text-yellow-600 hover:text-yellow-700 p-2 font-medium inline-flex items-center bg-yellow-600/10 hover:bg-yellow-600/30 rounded-sm mr-2"
                                  title="แก้ไข"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {canDelete() && (
                                  <button
                                    onClick={() => handleDeletePrize(prize)}
                                    className="text-red-600 hover:text-red-700 p-2 font-medium inline-flex items-center bg-red-600/10 hover:bg-red-600/30 rounded-sm"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">ผู้มีสิทธิ์รับรางวัล</h3>
                <div className="text-sm text-gray-500">
                  ทั้งหมด {participants.length} คน
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  ยังไม่มีผู้เข้าร่วมกิจกรรมนี้
                </div>
              ) : (
                <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ชื่อ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          หน่วยงาน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant) => {
                        const isWinner = winners.some(w => w.participant === participant.id);
                        return (
                          <tr key={participant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {participant.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {participant.department_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isWinner ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                  ได้ได้รางวัลแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  ยังไม่ได้รับรางวัล
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Prize Form Modal */}
      <PrizeFormModal
        isOpen={isPrizeFormOpen}
        onClose={() => {
          setIsPrizeFormOpen(false);
          setSelectedPrize(null);
        }}
        onSave={handleSavePrize}
        prize={selectedPrize}
        raffleEventId={raffle?.id || null}
      />

      {/* Prize Detail Modal */}
      <PrizeDetailModal
        isOpen={isPrizeDetailOpen}
        onClose={() => {
          setIsPrizeDetailOpen(false);
          setSelectedPrize(null);
        }}
        prize={selectedPrize}
      />

      {/* Participant Selector Modal */}
      <ParticipantSelectorModal
        isOpen={isParticipantSelectorOpen}
        onClose={() => {
          setIsParticipantSelectorOpen(false);
          setSelectedPrize(null);
          setSelectedParticipantIds([]);
        }}
        onConfirm={handleSaveParticipants}
        eventId={raffle?.event || null}
        selectedParticipants={selectedParticipantIds}
        title={selectedPrize ? `เลือกผู้มีสิทธิ์รับรางวัล: ${selectedPrize.name}` : 'เลือกผู้มีสิทธิ์รับรางวัล'}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPrize(null);
        }}
        onConfirm={handleDeletePrizeConfirm}
        title="ยืนยันการลบรางวัล"
        itemName={selectedPrize?.name || ''}
      />
    </>
  );
}
