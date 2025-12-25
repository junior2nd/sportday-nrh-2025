'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SpinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prizeName?: string;
  displayCount: number;
  loading?: boolean;
}

export default function SpinConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  prizeName,
  displayCount,
  loading = false,
}: SpinConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">ยืนยันการจับสลาก</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            คุณต้องการจับสลากรางวัล{prizeName ? ` "${prizeName}"` : ''} จำนวน <strong>{displayCount}</strong> รางวัล ใช่หรือไม่?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            หลังจากกดยืนยัน ระบบจะเริ่มการจับสลากทันที
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

