'use client';

import Modal from '@/components/ui/Modal';
import { Prize } from '@/lib/api/raffle';
import { Gift, Hash, Package, Users } from 'lucide-react';

interface PrizeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
}

export default function PrizeDetailModal({ isOpen, onClose, prize }: PrizeDetailModalProps) {
  if (!prize) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`รายละเอียดรางวัล`}
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
        {/* Prize Name */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{prize.name}</h2>
            <Gift className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* Raffle Event */}
        <div>
          <div className="flex items-center mb-2">
            <Gift className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">การจับสลาก</h3>
          </div>
          <p className="text-gray-600">{prize.raffle_event_name}</p>
        </div>

        {/* Round and Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Hash className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">รอบที่</h3>
            </div>
            <p className="text-gray-600 text-lg font-semibold">{prize.round_number}</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Package className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">จำนวน</h3>
            </div>
            <p className="text-gray-600 text-lg font-semibold">{prize.quantity} รางวัล</p>
          </div>
        </div>

        {/* Selected Count */}
        <div>
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">จำนวนผู้ได้รับรางวัล</h3>
          </div>
          <p className="text-gray-600 text-lg font-semibold">
            {prize.selected_count || 0} / {prize.quantity} คน
          </p>
          {prize.selected_count >= prize.quantity && (
            <p className="text-sm text-emerald-600 mt-1">✓ รางวัลครบจำนวนแล้ว</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

