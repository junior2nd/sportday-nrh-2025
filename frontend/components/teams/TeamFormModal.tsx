'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Team } from '@/lib/api/teams';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Partial<Team>) => Promise<void>;
  team?: Team | null;
  eventId?: number | null;
  orgId?: number;
}

export default function TeamFormModal({ isOpen, onClose, onSave, team, eventId, orgId }: TeamFormModalProps) {
  const [formData, setFormData] = useState({
    color_name: '',
    color_code: '#000000',
    max_members: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (team) {
      setFormData({
        color_name: team.color_name || '',
        color_code: team.color_code || '#000000',
        max_members: team.max_members?.toString() || '',
      });
    } else {
      // Reset form for new team
      setFormData({
        color_name: '',
        color_code: '#000000',
        max_members: '',
      });
    }
    setError('');
  }, [team, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.color_name.trim()) {
      setError('กรุณากรอกชื่อทีม');
      return;
    }
    if (!formData.color_code || !/^#[0-9A-F]{6}$/i.test(formData.color_code)) {
      setError('กรุณากรอกรหัสสีในรูปแบบ HEX (เช่น #FF0000)');
      return;
    }
    if (!eventId) {
      setError('กรุณาเลือกกิจกรรมก่อนสร้างทีม');
      return;
    }
    if (!orgId) {
      setError('ไม่พบข้อมูลหน่วยงาน');
      return;
    }

    try {
      setIsSubmitting(true);
      const teamData: Partial<Team> = {
        color_name: formData.color_name.trim(),
        color_code: formData.color_code.toUpperCase(),
        event: eventId,
        org: orgId,
        max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
      };

      await onSave(teamData);
      onClose();
    } catch (err: any) {
      console.error('Error saving team:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.color_name?.[0]
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
      title={team ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
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
            form="team-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="color_name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อทีม <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="color_name"
            required
            value={formData.color_name}
            onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="เช่น แดง, น้ำเงิน, ทีม A, ทีม B"
          />
        </div>

        <div>
          <label htmlFor="color_code" className="block text-sm font-medium text-gray-700 mb-1">
            สีประจำทีม (HEX) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              id="color_code"
              value={formData.color_code}
              onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              required
              value={formData.color_code}
              onChange={(e) => {
                let value = e.target.value;
                // Auto-add # if user types without it
                if (value && !value.startsWith('#')) {
                  value = '#' + value;
                }
                setFormData({ ...formData, color_code: value });
              }}
              pattern="#[0-9A-Fa-f]{6}"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 uppercase"
              placeholder="#FF0000"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">เลือกสีหรือกรอกรหัสสีในรูปแบบ HEX (ใช้สำหรับแสดงผล)</p>
        </div>

        <div>
          <label htmlFor="max_members" className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนสมาชิกสูงสุด (ไม่บังคับ)
          </label>
          <input
            type="number"
            id="max_members"
            min="1"
            value={formData.max_members}
            onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="เช่น 10 (เว้นว่างถ้าไม่จำกัด)"
          />
        </div>
      </form>
    </Modal>
  );
}

