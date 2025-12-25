'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/lib/api/events';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvents, useDeleteEvent, useCreateEvent, useUpdateEvent } from '@/lib/hooks/data/useEvents';
import { useModal } from '@/lib/hooks/ui/useModal';
import { formatDateShort } from '@/lib/utils/format';
import dynamic from 'next/dynamic';

const EventFormModal = dynamic(() => import('@/components/events/EventFormModal'), {
  ssr: false,
});
const DeleteConfirmModal = dynamic(() => import('@/components/events/DeleteConfirmModal'), {
  ssr: false,
});
const EventDetailModal = dynamic(() => import('@/components/events/EventDetailModal'), {
  ssr: false,
});
import DataTable from '@/components/ui/DataTable';
import ActionButtons from '@/components/ui/ActionButtons';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Plus } from 'lucide-react';

export default function EventsPage() {
  const pathname = usePathname();
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const lastPathnameRef = useRef<string | null>(null);

  const { data: events = [], isLoading, error } = useEvents();
  const deleteMutation = useDeleteEvent();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const formModal = useModal<Event>();
  const deleteModal = useModal<Event>();
  const detailModal = useModal<Event>();

  const handleCreate = useCallback(() => {
    formModal.open();
  }, [formModal]);

  const handleEdit = useCallback((event: Event) => {
    formModal.open(event);
  }, [formModal]);

  const handleDeleteClick = useCallback((event: Event) => {
    deleteModal.open(event);
  }, [deleteModal]);

  const handleViewDetail = useCallback((event: Event) => {
    detailModal.open(event);
  }, [detailModal]);

  const handleSave = useCallback(async (eventData: EventCreate | Partial<EventCreate>) => {
    try {
      if (formModal.selectedItem) {
        // Update existing event
        await updateMutation.mutateAsync({
          id: formModal.selectedItem.id,
          data: eventData,
        });
      } else {
        // Create new event
        await createMutation.mutateAsync(eventData as EventCreate);
      }
      formModal.close();
    } catch (err: any) {
      // Error will be handled by EventFormModal
      throw err;
    }
  }, [formModal, createMutation, updateMutation]);

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
    if (!canCreateValue) return undefined;
    return (
      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span>สร้างกิจกรรมใหม่</span>
      </button>
    );
  }, [canCreateValue, handleCreate]);

  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      setHeader(
        'กิจกรรม',
        'จัดการกิจกรรมต่างๆ ที่จัดขึ้นในหน่วยงานของคุณ',
        actionButton
      );
    }
  }, [pathname, setHeader, actionButton]);

  const columns = [
    {
      key: 'name' as const,
      header: 'ชื่อกิจกรรม',
      render: (item: Event) => (
        <Link
          href={`/events/${item.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: 'start_date' as const,
      header: 'วันที่เริ่ม',
      render: (item: Event) => formatDateShort(item.start_date),
    },
    {
      key: 'end_date' as const,
      header: 'วันที่สิ้นสุด',
      render: (item: Event) => formatDateShort(item.end_date),
    },
    {
      key: 'status' as const,
      header: 'สถานะ',
      render: (item: Event) => (
        <StatusBadge status={item.status} label={item.status_display} />
      ),
    },
    {
      key: 'actions' as const,
      header: 'การจัดการ',
      className: 'text-right',
      render: (item: Event) => (
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
      {error && (
        <ErrorMessage message={error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลได้'} />
      )}

      <DataTable
        columns={columns}
        data={events}
        loading={isLoading}
        emptyMessage="ยังไม่มีกิจกรรม"
        emptyTitle="ไม่พบข้อมูล"
        keyExtractor={(item) => item.id}
      />

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSave={handleSave}
        event={formModal.selectedItem}
        orgId={user?.org_id}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="ยืนยันการลบกิจกรรม"
        itemName={deleteModal.selectedItem?.name || ''}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        event={detailModal.selectedItem}
      />
    </div>
  );
}
