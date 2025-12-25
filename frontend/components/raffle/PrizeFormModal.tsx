'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Prize } from '@/lib/api/raffle';

interface PrizeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prize: Partial<Prize>) => Promise<void>;
  prize?: Prize | null;
  raffleEventId: number | null;
}

export default function PrizeFormModal({ isOpen, onClose, onSave, prize, raffleEventId }: PrizeFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    round_number: 1,
    quantity: 1,
    rules: {} as Record<string, any>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prize) {
      setFormData({
        name: prize.name || '',
        round_number: prize.round_number || 1,
        quantity: prize.quantity || 1,
        rules: prize.rules || {},
      });
    } else {
      setFormData({
        name: '',
        round_number: 1,
        quantity: 1,
        rules: {},
      });
    }
    setError('');
  }, [prize, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อรางวัล');
      return;
    }
    if (!raffleEventId) {
      setError('กรุณาเลือกการจับสลาก');
      return;
    }
    if (formData.round_number < 1) {
      setError('รอบที่ต้องมากกว่า 0');
      return;
    }
    if (formData.quantity < 1) {
      setError('จำนวนต้องมากกว่า 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const prizeData: Partial<Prize> = {
        ...formData,
        raffle_event: raffleEventId,
      };

      await onSave(prizeData);
      onClose();
    } catch (err: any) {
      console.error('Error saving prize:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.raffle_event?.[0] 
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
      title={prize ? 'แก้ไขรางวัล' : 'สร้างรางวัลใหม่'}
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
            form="prize-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="prize-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="round_number" className="block text-sm font-medium text-gray-700 mb-1">
              รอบที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="round_number"
              required
              min="1"
              value={formData.round_number || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, round_number: 0 });
                } else {
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, round_number: numValue });
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              จำนวน <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              required
              min="1"
              value={formData.quantity || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  setFormData({ ...formData, quantity: 0 });
                } else {
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, quantity: numValue });
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อรางวัล <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกชื่อรางวัล"
          />
        </div>
      </form>
    </Modal>
  );
}

