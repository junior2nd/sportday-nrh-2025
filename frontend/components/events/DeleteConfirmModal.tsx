'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  itemName: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
}: DeleteConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('กรุณากรอกเหตุผลในการลบ');
      return;
    }

    if (reason.trim().length < 10) {
      setError('เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบ');
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
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="delete-form"
            disabled={isSubmitting || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
          </button>
        </div>
      }
    >
      <form id="delete-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-3 bg-red-50 p-2 rounded-sm">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 ">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-semibold">{itemName}</span>?
            </p>
            <p className="text-xs text-gray-500">
              การกระทำนี้ไม่สามารถยกเลิกได้ และจะมีการบันทึกเหตุผลในการลบไว้ในระบบ
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-700 mb-1">
            เหตุผลในการลบ <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">(อย่างน้อย 10 ตัวอักษร)</span>
          </label>
          <textarea
            id="delete-reason"
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            placeholder="กรอกเหตุผลในการลบ..."
            minLength={10}
          />
          <p className="mt-1 text-xs text-gray-500">
            {reason.length}/10 ตัวอักษร (ขั้นต่ำ)
          </p>
        </div>
      </form>
    </Modal>
  );
}

