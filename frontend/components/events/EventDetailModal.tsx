'use client';

import Modal from '@/components/ui/Modal';
import { Event } from '@/lib/api/events';
import { formatDateShort } from '@/lib/utils/format';
import { Calendar, Building2, FileText, Clock } from 'lucide-react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
  if (!event) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="รายละเอียดกิจกรรม"
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
        {/* Event Name */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
          <div className="mt-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(event.status)}`}>
              {event.status_display}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">รายละเอียด</h3>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Organization */}
        <div>
          <div className="flex items-center mb-2">
            <Building2 className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">หน่วยงาน</h3>
          </div>
          <p className="text-gray-600">{event.org_name}</p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">วันที่เริ่ม</h3>
            </div>
            <p className="text-gray-600">{formatDateShort(event.start_date)}</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">วันที่สิ้นสุด</h3>
            </div>
            <p className="text-gray-600">{formatDateShort(event.end_date)}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>สร้างเมื่อ: {formatDateShort(event.created_at)}</span>
            </div>
            {event.updated_at !== event.created_at && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>อัปเดตล่าสุด: {formatDateShort(event.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

