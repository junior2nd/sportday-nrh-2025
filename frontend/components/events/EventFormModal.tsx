'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Event, EventCreate } from '@/lib/api/events';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventCreate | Partial<EventCreate>) => Promise<void>;
  event?: Event | null;
  orgId?: number;
}

export default function EventFormModal({ isOpen, onClose, onSave, event, orgId }: EventFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'cancelled',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      // Format dates for input (YYYY-MM-DDTHH:mm)
      const startDate = new Date(event.start_date).toISOString().slice(0, 16);
      const endDate = new Date(event.end_date).toISOString().slice(0, 16);
      setFormData({
        name: event.name || '',
        description: event.description || '',
        start_date: startDate,
        end_date: endDate,
        status: event.status || 'draft',
      });
    } else {
      // Reset form for new event
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'draft',
      });
    }
    setError('');
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อกิจกรรม');
      return;
    }
    if (!formData.start_date) {
      setError('กรุณาเลือกวันที่เริ่ม');
      return;
    }
    if (!formData.end_date) {
      setError('กรุณาเลือกวันที่สิ้นสุด');
      return;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่ม');
      return;
    }
    if (!orgId) {
      setError('ไม่พบข้อมูลหน่วยงาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setIsSubmitting(true);
      const eventData: EventCreate | Partial<EventCreate> = {
        ...formData,
        org: orgId,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      if (event) {
        // Update existing event
        await onSave(eventData);
      } else {
        // Create new event
        await onSave(eventData as EventCreate);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving event:', err);
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
      title={event ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
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
            form="event-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อกิจกรรม <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกชื่อกิจกรรม"
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
            placeholder="กรอกรายละเอียดกิจกรรม (ถ้ามี)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่ม <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="start_date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="end_date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            สถานะ
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="draft">ร่าง</option>
            <option value="active">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

