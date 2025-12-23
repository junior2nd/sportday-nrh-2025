'use client';

import Modal from '@/components/ui/Modal';
import { LogOut, ArrowLeft } from 'lucide-react';

interface EventExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSelectOtherEvent: () => void;
}

export default function EventExitModal({
  isOpen,
  onClose,
  onLogout,
  onSelectOtherEvent,
}: EventExitModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ออกจาก Event"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            ยกเลิก
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">คุณต้องการทำอะไร?</p>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              onSelectOtherEvent();
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">เลือก Event อื่น</div>
              <div className="text-sm text-gray-500">กลับไปหน้าเลือก Event</div>
            </div>
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left border border-red-300 rounded-sm hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-red-900">ออกจากระบบ</div>
              <div className="text-sm text-red-600">ออกจากระบบทั้งหมด</div>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}

