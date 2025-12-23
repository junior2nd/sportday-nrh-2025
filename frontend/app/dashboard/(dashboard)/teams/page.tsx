'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Team } from '@/lib/api/teams';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { useTeams, useDeleteTeam } from '@/lib/hooks/data/useTeams';
import { useModal } from '@/lib/hooks/ui/useModal';
import dynamic from 'next/dynamic';

const TeamFormModal = dynamic(() => import('@/components/teams/TeamFormModal'), {
  ssr: false,
});
const DeleteConfirmModal = dynamic(() => import('@/components/events/DeleteConfirmModal'), {
  ssr: false,
});
const TeamDetailModal = dynamic(() => import('@/components/teams/TeamDetailModal'), {
  ssr: false,
});
import DataTable from '@/components/ui/DataTable';
import ActionButtons from '@/components/ui/ActionButtons';
import { Plus } from 'lucide-react';

export default function TeamsPage() {
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);
  const lastActionButtonDepsRef = useRef<{ canCreate: boolean; selectedEvent: number | null } | null>(null);

  const { data: teams = [], isLoading } = useTeams({ event: selectedEvent || undefined });
  const deleteMutation = useDeleteTeam();

  const formModal = useModal<Team>();
  const deleteModal = useModal<Team>();
  const detailModal = useModal<Team>();

  const handleCreate = useCallback(() => {
    formModal.open();
  }, [formModal]);

  const handleEdit = useCallback((team: Team) => {
    formModal.open(team);
  }, [formModal]);

  const handleDeleteClick = useCallback((team: Team) => {
    deleteModal.open(team);
  }, [deleteModal]);

  const handleViewDetail = useCallback((team: Team) => {
    detailModal.open(team);
  }, [detailModal]);

  const handleSave = useCallback(() => {
    formModal.close();
  }, [formModal]);

  const handleDelete = useCallback(async (reason: string) => {
    if (!deleteModal.selectedItem) return;
    await deleteMutation.mutateAsync({
      id: deleteModal.selectedItem.id,
      reason,
    });
    deleteModal.close();
  }, [deleteModal, deleteMutation]);

  const canCreateValue = canCreate();
  const actionButton = useMemo(() => {
    if (!canCreateValue || !selectedEvent) return undefined;
    return (
      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span>สร้างทีมใหม่</span>
      </button>
    );
  }, [canCreateValue, selectedEvent, handleCreate]);

  useEffect(() => {
    const pathnameChanged = lastPathnameRef.current !== pathname;
    const currentDeps = { canCreate: canCreateValue, selectedEvent };
    const depsChanged = !lastActionButtonDepsRef.current || 
      lastActionButtonDepsRef.current.canCreate !== currentDeps.canCreate ||
      lastActionButtonDepsRef.current.selectedEvent !== currentDeps.selectedEvent;
    
    if (pathnameChanged || depsChanged) {
      if (pathnameChanged) {
        lastPathnameRef.current = pathname;
      }
      if (depsChanged) {
        lastActionButtonDepsRef.current = currentDeps;
      }
      setHeader(
        'จัดการทีม',
        'จัดการและจัดแบ่งทีมสำหรับกิจกรรมต่างๆ',
        actionButton
      );
    }
  }, [pathname, setHeader, canCreateValue, selectedEvent, actionButton]);

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'color_name' as const,
      header: 'ชื่อทีม',
      render: (item: Team) => (
        <button
          onClick={() => handleViewDetail(item)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
        >
          {item.color_name}
        </button>
      ),
    },
    {
      key: 'color_code' as const,
      header: 'สีประจำทีม',
      render: (item: Team) => (
        <div className="flex items-center space-x-2">
          <div
            className="w-12 h-6 rounded-lg border-2 border-gray-200"
            style={{ backgroundColor: item.color_code }}
          />
          <span className="text-sm text-gray-500 font-mono">
            {item.color_code}
          </span>
        </div>
      ),
    },
    {
      key: 'member_count' as const,
      header: 'จำนวนสมาชิก',
      render: (item: Team) => `${item.member_count} คน`,
    },
    {
      key: 'actions' as const,
      header: 'การจัดการ',
      className: 'text-right',
      render: (item: Team) => (
        <ActionButtons
          onView={() => handleViewDetail(item)}
          onEdit={canEdit() ? () => handleEdit(item) : undefined}
          onDelete={canDelete() ? () => handleDeleteClick(item) : undefined}
          canView={true}
          canEdit={canEdit()}
          canDelete={canDelete()}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={teams}
        loading={isLoading}
        emptyMessage="ยังไม่มีทีมสำหรับกิจกรรมนี้"
        emptyTitle="ไม่พบข้อมูล"
        keyExtractor={(item) => item.id}
      />

      {/* Team Form Modal */}
      <TeamFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSave={handleSave}
        team={formModal.selectedItem}
        eventId={selectedEvent}
        orgId={user?.org_id}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="ยืนยันการลบทีม"
        itemName={deleteModal.selectedItem?.color_name || ''}
      />

      {/* Team Detail Modal */}
      <TeamDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        team={detailModal.selectedItem}
      />
    </div>
  );
}
