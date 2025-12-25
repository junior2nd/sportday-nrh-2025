'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { teamsApi, Participant } from '@/lib/api/teams';
import { Check, X } from 'lucide-react';

interface ParticipantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (participantIds: number[]) => Promise<void>;
  eventId: number | null;
  selectedParticipants?: number[];
  title?: string;
}

export default function ParticipantSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  eventId,
  selectedParticipants = [],
  title = 'เลือกผู้มีสิทธิ์รับรางวัล'
}: ParticipantSelectorModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(selectedParticipants));
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    setSelectedIds(new Set(selectedParticipants));
  }, [selectedParticipants]);

  const loadParticipants = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const data = await teamsApi.listParticipants({ event: eventId });
      const participantsArray = Array.isArray(data) ? data : [];
      setParticipants(participantsArray);
    } catch (err: any) {
      console.error('Error loading participants:', err);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setError('กรุณาเลือกผู้มีสิทธิ์รับรางวัลอย่างน้อย 1 คน');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(Array.from(selectedIds));
      onClose();
    } catch (err: any) {
      console.error('Error saving participants:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'เกิดข้อผิดพลาดในการบันทึก';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : `บันทึก (${selectedIds.size} คน)`}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {!eventId ? (
          <div className="text-center text-gray-500 py-8">
            กรุณาเลือกกิจกรรมก่อน
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            ไม่มีผู้เข้าร่วมกิจกรรมนี้
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              เลือกผู้มีสิทธิ์รับรางวัล ({selectedIds.size} / {participants.length} คน)
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-sm">
              <div className="divide-y divide-gray-200">
                {participants.map((participant) => {
                  const isSelected = selectedIds.has(participant.id);
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => toggleParticipant(participant.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                        {participant.department_name && (
                          <p className="text-xs text-gray-500 mt-1">หน่วยงาน: {participant.department_name}</p>
                        )}
                      </div>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

