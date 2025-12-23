'use client';

import Modal from '@/components/ui/Modal';
import { Team } from '@/lib/api/teams';
import { Users, Palette, Calendar, Building2, Info } from 'lucide-react';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
}

export default function TeamDetailModal({ isOpen, onClose, team }: TeamDetailModalProps) {
  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`รายละเอียดทีม: ${team.color_name}`}
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
        {/* Team Name and Color */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{team.color_name}</h2>
            <div className="flex items-center space-x-3">
              <div
                className="w-16 h-10 rounded-lg border-2 border-gray-200 shadow-sm"
                style={{ backgroundColor: team.color_code }}
              ></div>
              <div className="text-sm text-gray-500 font-mono">
                {team.color_code}
              </div>
            </div>
          </div>
        </div>

        {/* Event Information */}
        <div>
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">กิจกรรม</h3>
          </div>
          <p className="text-gray-600">{team.event_name}</p>
        </div>

        {/* Organization */}
        <div>
          <div className="flex items-center mb-2">
            <Building2 className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">หน่วยงาน</h3>
          </div>
          <p className="text-gray-600">
            {team.org_name ? (
              <>
                <span className="text-gray-400 bg-gray-100 text-sm px-3 rounded-lg mr-2">ID: {team.org}</span> {team.org_name}
              </>
            ) : (
              `ID: ${team.org}`
            )}
          </p>
        </div>

        {/* Members Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">จำนวนสมาชิก</h3>
            </div>
            <p className="text-gray-600 text-lg font-semibold">{team.member_count} คน</p>
          </div>
          {team.max_members && (
            <div>
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">จำนวนสมาชิกสูงสุด</h3>
              </div>
              <p className="text-gray-600 text-lg font-semibold">{team.max_members} คน</p>
              {team.member_count >= team.max_members && (
                <p className="text-sm text-red-600 mt-1">⚠️ จำนวนสมาชิกเต็มแล้ว</p>
              )}
            </div>
          )}
        </div>

        {/* Color Information */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <Palette className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">สีประจำทีม</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{ backgroundColor: team.color_code }}
            ></div>
            <div>
              <p className="text-sm text-gray-600">รหัสสี: <span className="font-mono font-semibold">{team.color_code}</span></p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

