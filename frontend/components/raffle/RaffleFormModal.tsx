'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { RaffleEvent } from '@/lib/api/raffle';
import { eventsApi, Event } from '@/lib/api/events';

interface RaffleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (raffle: Partial<RaffleEvent>) => Promise<void>;
  raffle?: RaffleEvent | null;
  orgId?: number;
}

export default function RaffleFormModal({ isOpen, onClose, onSave, raffle, orgId }: RaffleFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event: '',
    rules: {} as Record<string, any>,
    no_repeat_prize: false,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (raffle) {
      setFormData({
        name: raffle.name || '',
        description: raffle.description || '',
        event: raffle.event?.toString() || '',
        rules: raffle.rules || {},
        no_repeat_prize: raffle.no_repeat_prize || false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        event: '',
        rules: {},
        no_repeat_prize: false,
      });
    }
    setError('');
  }, [raffle, isOpen]);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.list();
      const eventsArray = Array.isArray(data) ? data : [];
      setEvents(eventsArray);
    } catch (err) {
      console.error('Error loading events:', err);
      setEvents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อการจับสลาก');
      return;
    }
    if (!formData.event) {
      setError('กรุณาเลือกกิจกรรม');
      return;
    }
    if (!orgId) {
      setError('ไม่พบข้อมูลหน่วยงาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setIsSubmitting(true);
      const raffleData: Partial<RaffleEvent> = {
        ...formData,
        org: orgId,
        event: Number(formData.event),
      };

      await onSave(raffleData);
      onClose();
    } catch (err: any) {
      console.error('Error saving raffle:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.org?.[0] 
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
      title={raffle ? 'แก้ไขการจับสลาก' : 'สร้างการจับสลากใหม่'}
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
            form="raffle-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="raffle-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
            กิจกรรม <span className="text-red-500">*</span>
          </label>
          <select
            id="event"
            required
            value={formData.event}
            onChange={(e) => setFormData({ ...formData, event: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            disabled={!!raffle}
          >
            <option value="">-- เลือกกิจกรรม --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อการจับสลาก <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกชื่อการจับสลาก"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            รายละเอียด
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกรายละเอียดการจับสลาก (ถ้ามี)"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.no_repeat_prize}
              onChange={(e) => setFormData({ ...formData, no_repeat_prize: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">ไม่รับรางวัลซ้ำ</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            ถ้าเปิด ผู้ที่ได้รับรางวัลแล้วจะไม่ถูกเลือกอีกในการจับสลากครั้งถัดไป
          </p>
        </div>
      </form>
    </Modal>
  );
}

