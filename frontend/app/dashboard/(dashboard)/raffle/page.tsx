'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { RaffleEvent } from '@/lib/api/raffle';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { useRaffleEvents, useDeleteRaffleEvent } from '@/lib/hooks/data/useRaffle';
import { useModal } from '@/lib/hooks/ui/useModal';
import dynamic from 'next/dynamic';

const RaffleFormModal = dynamic(() => import('@/components/raffle/RaffleFormModal'), {
  ssr: false,
});
const DeleteConfirmModal = dynamic(() => import('@/components/events/DeleteConfirmModal'), {
  ssr: false,
});
const RaffleDetailModal = dynamic(() => import('@/components/raffle/RaffleDetailModal'), {
  ssr: false,
});
import DataTable from '@/components/ui/DataTable';
import ActionButtons from '@/components/ui/ActionButtons';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Plus, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RafflePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const lastPathnameRef = useRef<string | null>(null);

  const { data: raffleEvents = [], isLoading, error } = useRaffleEvents({
    event: selectedEvent || undefined,
  });
  const deleteMutation = useDeleteRaffleEvent();

  const formModal = useModal<RaffleEvent>();
  const deleteModal = useModal<RaffleEvent>();
  const detailModal = useModal<RaffleEvent>();

  const handleCreate = useCallback(() => {
    formModal.open();
  }, [formModal]);

  const handleEdit = useCallback((raffle: RaffleEvent) => {
    formModal.open(raffle);
  }, [formModal]);

  const handleDeleteClick = useCallback((raffle: RaffleEvent) => {
    deleteModal.open(raffle);
  }, [deleteModal]);

  const handleViewDetail = useCallback((raffle: RaffleEvent) => {
    detailModal.open(raffle);
  }, [detailModal]);

  const handleSave = useCallback(async () => {
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
    const buttons = [];
    
    // Add create button if user can create
    if (canCreateValue) {
      buttons.push(
        <button
          key="create"
          onClick={handleCreate}
          className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>สร้างการจับสลากใหม่</span>
        </button>
      );
    }
    
    // Add display button if there's at least one raffle event
    if (raffleEvents.length > 0) {
      const firstRaffleEvent = raffleEvents[0];
      buttons.push(
        <a
          key="display"
          href={`/raffle/display?raffle_event=${firstRaffleEvent.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600/20 text-blue-600 rounded-sm hover:bg-blue-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
        >
          <ExternalLink className="w-5 h-5" />
          <span>เปิดหน้าจอจับสลาก</span>
        </a>
      );
    }
    
    if (buttons.length === 0) return undefined;
    return <div className="flex items-center gap-2">{buttons}</div>;
  }, [canCreateValue, raffleEvents, handleCreate]);

  useEffect(() => {
    const pathnameChanged = lastPathnameRef.current !== pathname;
    const currentDeps = { canCreate: canCreateValue, raffleEventsCount: raffleEvents.length };
    const lastDeps = lastPathnameRef.current ? { canCreate: canCreateValue, raffleEventsCount: raffleEvents.length } : null;
    const depsChanged = !lastDeps || 
      lastDeps.canCreate !== currentDeps.canCreate ||
      lastDeps.raffleEventsCount !== currentDeps.raffleEventsCount;
    
    if (pathnameChanged || depsChanged) {
      if (pathnameChanged) {
        lastPathnameRef.current = pathname;
      }
      setHeader(
        'การจับสลาก',
        'สร้างและจัดการกิจกรรมการจับสลาก',
        actionButton
      );
    }
  }, [pathname, setHeader, actionButton, canCreateValue, raffleEvents.length]);

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'name' as const,
      header: 'ชื่อการจับสลาก',
    },
    {
      key: 'event_name' as const,
      header: 'กิจกรรม',
    },
    {
      key: 'description' as const,
      header: 'รายละเอียด',
    },
    {
      key: 'actions' as const,
      header: 'การจัดการ',
      className: 'text-right',
      render: (item: RaffleEvent) => (
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

  // Use regular columns without create button row
  const columnsWithActions = useMemo(() => {
    return columns.map(col => {
      if (col.key === 'actions') {
        return {
          ...col,
          render: (item: RaffleEvent) => (
            <ActionButtons
              onView={() => handleViewDetail(item)}
              onEdit={canEdit() ? () => handleEdit(item) : undefined}
              onDelete={canDelete() ? () => handleDeleteClick(item) : undefined}
              canView={true}
              canEdit={canEdit()}
              canDelete={canDelete()}
            />
          ),
        };
      }
      return col;
    });
  }, [columns, canEdit, canDelete, handleViewDetail, handleEdit, handleDeleteClick]);

  return (
    <div className="space-y-6">
      {error && (
        <ErrorMessage message={error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลได้'} />
      )}

      <DataTable
        columns={columnsWithActions}
        data={raffleEvents}
        loading={isLoading}
        emptyMessage="ยังไม่มีการจับสลากสำหรับกิจกรรมนี้"
        emptyTitle="ไม่พบข้อมูล"
        keyExtractor={(item: RaffleEvent) => item.id}
      />

      {/* Raffle Form Modal */}
      <RaffleFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSave={handleSave}
        raffle={formModal.selectedItem}
        eventId={selectedEvent}
        orgId={user?.org_id}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="ยืนยันการลบการจับสลาก"
        itemName={deleteModal.selectedItem?.name || ''}
      />

      {/* Raffle Detail Modal */}
      <RaffleDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        raffle={detailModal.selectedItem}
      />
    </div>
  );
}
