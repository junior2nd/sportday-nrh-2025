'use client';

import { Event } from '@/lib/api/events';
import { Settings, Calendar, Clock } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onSelect: (eventId: number) => void;
  onConfig: (event: Event) => void;
}

export default function EventCard({ event, onSelect, onConfig }: EventCardProps) {
  const statusConfig = {
    draft: { label: 'ร่าง', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    active: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800 border-green-300' },
    cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800 border-red-300' },
  };

  const status = statusConfig[event.status] || statusConfig.draft;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${day} ${monthNames[month - 1]} ${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden relative">
      {/* Config Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onConfig(event);
        }}
        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        title="ตั้งค่าสถานะ"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Card Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Event Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{event.name}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        )}

        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>เริ่ม: {formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>สิ้นสุด: {formatDate(event.end_date)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(event.id)}
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors font-medium text-sm"
        >
          {event.status === 'active' ? 'จัดการ' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}

