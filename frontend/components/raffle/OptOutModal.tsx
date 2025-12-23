'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

interface OptOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  participantName: string;
}

export default function OptOutModal({
  isOpen,
  onClose,
  onConfirm,
  participantName,
}: OptOutModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      console.error('Error opting out participant:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'เกิดข้อผิดพลาดในการตัดสิทธิ';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ตัดสิทธิรับรางวัล"
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
            form="opt-out-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังตัดสิทธิ...' : 'ยืนยันตัดสิทธิ'}
          </button>
        </div>
      }
    >
      <form id="opt-out-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <p className="text-sm text-gray-700 mb-2">
            คุณต้องการตัดสิทธิรับรางวัลสำหรับ <span className="font-semibold">{participantName}</span> หรือไม่?
          </p>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            เหตุผล (ไม่บังคับ)
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกเหตุผลในการตัดสิทธิ (ถ้ามี)"
          />
        </div>
      </form>
    </Modal>
  );
}

