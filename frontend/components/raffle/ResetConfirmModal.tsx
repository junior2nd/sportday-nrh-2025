'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title: string;
  itemName?: string;
  isResetAll?: boolean;
}

export default function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isResetAll = false,
}: ResetConfirmModalProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    // Hardcoded reset password
    const requiredPassword = '10897';
    if (password.trim() !== requiredPassword) {
      setError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(password.trim());
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('Error resetting:', err);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'เกิดข้อผิดพลาดในการรีเซ็ต';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="reset-form"
            disabled={isSubmitting || !password.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ต'}
          </button>
        </div>
      }
    >
      <form id="reset-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 mb-4">
              {isResetAll ? (
                <>คุณกำลังจะรีเซ็ตรางวัลทั้งหมดในกิจกรรมนี้ การดำเนินการนี้จะลบรายชื่อผู้ได้รับรางวัลทั้งหมดและไม่สามารถย้อนกลับได้</>
              ) : (
                <>คุณกำลังจะรีเซ็ตรางวัล <strong>{itemName}</strong> การดำเนินการนี้จะลบรายชื่อผู้ได้รับรางวัลนี้ทั้งหมดและไม่สามารถย้อนกลับได้</>
              )}
            </p>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="กรุณากรอกรหัสผ่าน"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                กรุณากรอกรหัสผ่านเพื่อยืนยันการรีเซ็ต
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

