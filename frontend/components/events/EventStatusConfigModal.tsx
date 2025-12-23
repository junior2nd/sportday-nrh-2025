'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Event } from '@/lib/api/events';
import { eventsApi } from '@/lib/api/events';

interface EventStatusConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onStatusUpdated: () => void;
}

export default function EventStatusConfigModal({
  isOpen,
  onClose,
  event,
  onStatusUpdated,
}: EventStatusConfigModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Event['status']>(event?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!event) return null;

  const statusOptions: { value: Event['status']; label: string; color: string }[] = [
    { value: 'draft', label: 'ร่าง', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'ยกเลิก', color: 'bg-red-100 text-red-800' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!event) return;

    try {
      setIsSubmitting(true);
      await eventsApi.updateStatus(event.id, selectedStatus);
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating event status:', err);
      setError(err.response?.data?.detail || err.response?.data?.status?.[0] || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`เปลี่ยนสถานะ: ${event.name}`}
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
            type="submit"
            form="status-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="status-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะปัจจุบัน
          </label>
          <div className="inline-block">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusOptions.find(opt => opt.value === event.status)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {statusOptions.find(opt => opt.value === event.status)?.label || event.status}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            เปลี่ยนเป็นสถานะ
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as Event['status'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

