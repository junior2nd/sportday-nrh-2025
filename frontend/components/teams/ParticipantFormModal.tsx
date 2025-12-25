'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { coreApi, Department } from '@/lib/api/core';
import { teamsApi, Team, Participant } from '@/lib/api/teams';
import { useAuth } from '@/lib/hooks/useAuth';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  participant?: Participant | null;
  eventId?: number | null;
  orgId?: number;
}

export default function ParticipantFormModal({
  isOpen,
  onClose,
  onSave,
  participant,
  eventId,
  orgId,
}: ParticipantFormModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    department: null as number | null,
    team: null as number | null,
    is_raffle_eligible: true,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (orgId) {
        loadDepartments();
      }
      if (eventId) {
        loadTeams();
        // Load current team for participant if updating
        if (participant) {
          loadCurrentTeam(participant.id);
        }
      }
      if (participant) {
        setFormData({
          name: participant.name || '',
          department: participant.department || null,
          team: null, // Will be set after loading current team
          is_raffle_eligible: participant.is_raffle_eligible !== undefined ? participant.is_raffle_eligible : true,
        });
      } else {
        setFormData({
          name: '',
          department: null,
          team: null,
          is_raffle_eligible: true,
        });
      }
      setError('');
    }
  }, [isOpen, participant, eventId, orgId]);

  const loadDepartments = async () => {
    if (!orgId) return;
    try {
      const data = await coreApi.listDepartments({ org: orgId, is_active: true });
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

  const loadCurrentTeam = async (participantId: number) => {
    if (!eventId) return;
    try {
      // Get team members for this participant in this event
      const teamMembers = await teamsApi.listTeamMembers({ participant: participantId, event: eventId });
      if (teamMembers && teamMembers.length > 0) {
        // Get the first team member (should only be one per event due to unique constraint)
        const teamMember = teamMembers[0];
        setFormData(prev => ({
          ...prev,
          team: teamMember.team || null,
        }));
      }
    } catch (err) {
      console.error('Error loading current team:', err);
      // If error, just leave team as null
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

    if (!eventId || !orgId) {
      setError('ไม่พบข้อมูลกิจกรรมหรือหน่วยงาน');
      return;
    }

    try {
      setIsSubmitting(true);
      const participantData: Partial<Participant> = {
        org: orgId,
        event: eventId,
        name: formData.name.trim(),
        department: formData.department || undefined,
        is_raffle_eligible: formData.is_raffle_eligible,
      };

      if (participant) {
        // Update existing participant
        const updatedParticipant = await teamsApi.updateParticipant(participant.id, participantData);
        
        // Handle team membership
        if (eventId) {
          // Get current team members for this participant in this event
          const currentTeamMembers = await teamsApi.listTeamMembers({ participant: participant.id, event: eventId });
          
          if (formData.team) {
            // If team is selected
            if (currentTeamMembers && currentTeamMembers.length > 0) {
              // Update existing team member
              const existingTeamMember = currentTeamMembers[0];
              if (existingTeamMember.team !== formData.team) {
                // Team changed - update it
                await teamsApi.updateTeamMember(existingTeamMember.id, {
                  team: formData.team,
                  event: eventId,
                });
              }
            } else {
              // No team member exists - create new one
              await teamsApi.createTeamMember({
                team: formData.team,
                participant: participant.id,
                event: eventId,
              });
            }
          } else {
            // No team selected - remove team membership if exists
            if (currentTeamMembers && currentTeamMembers.length > 0) {
              for (const teamMember of currentTeamMembers) {
                await teamsApi.deleteTeamMember(teamMember.id);
              }
            }
          }
        }
      } else {
        // Create new participant
        const createdParticipant = await teamsApi.createParticipant(participantData);
        
        // If team is selected, add participant to team
        if (formData.team && eventId) {
          await teamsApi.createTeamMember({
            team: formData.team,
            participant: createdParticipant.id,
            event: eventId,
          });
        }
      }

      await onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving participant:', err);
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
      title={participant ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อใหม่'}
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
            form="participant-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="participant-form" onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            หน่วยงาน
          </label>
          <select
            id="department"
            value={formData.department || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- เลือกหน่วยงาน (ไม่บังคับ) --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
            ทีม
          </label>
          <select
            id="team"
            value={formData.team || ''}
            onChange={(e) => setFormData({ ...formData, team: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- เลือกทีม (ไม่บังคับ) --</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.color_name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {participant ? 'สามารถเปลี่ยนทีมได้' : 'สามารถเพิ่มทีมได้ภายหลัง'}
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_raffle_eligible}
              onChange={(e) => setFormData({ ...formData, is_raffle_eligible: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">มีสิทธิ์จับรางวัล</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

