'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { coreApi, Department } from '@/lib/api/core';
import { teamsApi, Team, Participant } from '@/lib/api/teams';
import { useAuth } from '@/lib/hooks/useAuth';

interface AddEligibleParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  raffleEventId: number | null;
  eventId: number | null;
}

export default function AddEligibleParticipantModal({
  isOpen,
  onClose,
  onSave,
  raffleEventId,
  eventId,
}: AddEligibleParticipantModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    department_id: null as number | null,
    team_id: null as number | null,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      loadDepartments();
      loadTeams();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({ name: '', department_id: null, team_id: null });
      setError('');
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    if (!user?.org_id) return;
    try {
      const data = await coreApi.listDepartments({ org: user.org_id, is_active: true });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading departments:', err);
      setDepartments([]);
    }
  };

  const loadTeams = async () => {
    if (!eventId) return;
    try {
      const data = await teamsApi.listTeams({ event: eventId });
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading teams:', err);
      setTeams([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    if (!raffleEventId) {
      setError('ไม่พบข้อมูลการจับสลาก');
      return;
    }

    if (!eventId || !user?.org_id) {
      setError('ไม่พบข้อมูลกิจกรรมหรือหน่วยงาน');
      return;
    }

    try {
      setIsSubmitting(true);
      // Create participant using teams API
      const participantData: Partial<Participant> = {
        org: user.org_id,
        event: eventId,
        name: formData.name.trim(),
        department: formData.department_id || undefined,
        is_raffle_eligible: true, // Default to eligible
      };
      
      const participant = await teamsApi.createParticipant(participantData);
      
      // Assign to team if team_id is provided
      if (formData.team_id && participant.id) {
        try {
          await teamsApi.createTeamMember({
            team: formData.team_id,
            participant: participant.id,
            event: eventId,
          });
        } catch (teamErr: any) {
          // Log error but don't fail the whole operation
          console.warn('Failed to assign participant to team:', teamErr);
        }
      }
      
      await onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving eligible participant:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.response?.data?.name?.[0]
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
      title="เพิ่มผู้มีสิทธิ์รับรางวัล"
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
            form="add-eligible-participant-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="add-eligible-participant-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกชื่อ-นามสกุล"
          />
        </div>

        <div>
          <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
            หน่วยงาน
          </label>
          <select
            id="department_id"
            value={formData.department_id || ''}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- ไม่ระบุ --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">
            ทีม
          </label>
          <select
            id="team_id"
            value={formData.team_id || ''}
            onChange={(e) => setFormData({ ...formData, team_id: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- ไม่ระบุ --</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.color_name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

