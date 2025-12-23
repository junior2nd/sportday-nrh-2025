'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Participant } from '@/lib/api/teams';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { useParticipants, useDeleteParticipant } from '@/lib/hooks/data/useParticipants';
import { usePagination } from '@/lib/hooks/ui/usePagination';
import { useSearch } from '@/lib/hooks/ui/useSearch';
import { useModal } from '@/lib/hooks/ui/useModal';
import { extractResults, extractPagination, isPaginatedResponse } from '@/lib/utils/api';
import dynamic from 'next/dynamic';

const ParticipantFormModal = dynamic(() => import('@/components/teams/ParticipantFormModal'), {
  ssr: false,
});
const ParticipantImportModal = dynamic(() => import('@/components/teams/ParticipantImportModal'), {
  ssr: false,
});
const DeleteConfirmModal = dynamic(() => import('@/components/events/DeleteConfirmModal'), {
  ssr: false,
});
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import ActionButtons from '@/components/ui/ActionButtons';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plus, Upload } from 'lucide-react';

export default function ParticipantsPage() {
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);
  const lastActionButtonDepsRef = useRef<{ canCreate: boolean; selectedEvent: number | null } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState<string>('hospital_id');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: participantsResponse, isLoading, error } = useParticipants({
    event: selectedEvent || undefined,
    search: searchQuery || undefined,
    ordering,
    page: currentPage,
    page_size: pageSize,
  });

  const participants = useMemo(() => {
    if (!participantsResponse) return [];
    return extractResults<Participant>(participantsResponse);
  }, [participantsResponse]);

  const paginationInfo = useMemo(() => {
    if (!participantsResponse) return null;
    return extractPagination<Participant>(participantsResponse);
  }, [participantsResponse]);

  const pagination = usePagination({
    initialPage: currentPage,
    initialPageSize: pageSize,
    totalItems: paginationInfo?.count || participants.length,
  });

  const { localValue, setLocalValue, handleSubmit: handleSearchSubmit } = useSearch({
    initialValue: '',
    onSubmit: (value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    },
  });

  const formModal = useModal<Participant>();
  const deleteModal = useModal<Participant>();
  const importModal = useModal();
  const deleteMutation = useDeleteParticipant();

  const handleCreate = useCallback(() => {
    formModal.open();
  }, [formModal]);

  const handleImport = useCallback(() => {
    importModal.open();
  }, [importModal]);

  const handleImportSuccess = useCallback(() => {
    // Refresh data by resetting search or triggering refetch
    setCurrentPage(1);
    importModal.close();
  }, [importModal]);

  const handleEdit = useCallback((participant: Participant) => {
    formModal.open(participant);
  }, [formModal]);

  const handleDeleteClick = useCallback((participant: Participant) => {
    deleteModal.open(participant);
  }, [deleteModal]);

  const handleDelete = useCallback(async (reason: string) => {
    if (!deleteModal.selectedItem) return;
    await deleteMutation.mutateAsync({
      id: deleteModal.selectedItem.id,
      reason,
    });
    deleteModal.close();
  }, [deleteModal, deleteMutation]);

  const handleSave = useCallback(async () => {
    formModal.close();
  }, [formModal]);

  const handleOrderingChange = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setCurrentPage(1);
  }, []);

  const canCreateValue = canCreate();
  const actionButton = useMemo(() => {
    if (!canCreateValue || !selectedEvent) return undefined;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-blue-600/20 text-blue-600 rounded-sm hover:bg-blue-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
        >
          <Upload className="w-5 h-5" />
          <span>Import จาก Excel</span>
        </button>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มรายชื่อ</span>
        </button>
      </div>
    );
  }, [canCreateValue, selectedEvent, handleCreate, handleImport]);

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
        'รายชื่อ',
        'จัดการรายชื่อผู้เข้าร่วมกิจกรรม',
        actionButton
      );
    }
  }, [pathname, setHeader, canCreateValue, selectedEvent, actionButton]);

  useEffect(() => {
    if (selectedEvent && selectedEvent > 0) {
      setCurrentPage(1);
    }
  }, [selectedEvent]);

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'hospital_id' as const,
      header: 'ID โรงพยาบาล',
      render: (item: any) => (item as Participant).hospital_id || '-',
    },
    {
      key: 'name' as const,
      header: 'ชื่อ-นามสกุล',
    },
    {
      key: 'department_name' as const,
      header: 'แผนก',
      render: (item: any) => (item as Participant).department_name || '-',
    },
    {
      key: 'team' as const,
      header: 'ทีม',
      render: (item: any) => {
        const participant = item as Participant;
        return participant.team_name ? (
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded border border-gray-200"
              style={{ backgroundColor: participant.team_color_code || '#ccc' }}
            />
            <span>{participant.team_name}</span>
          </div>
        ) : '-';
      },
    },
    {
      key: 'is_raffle_eligible' as const,
      header: 'สิทธิจับรางวัล',
      render: (item: any) => {
        const participant = item as Participant;
        return (
          <StatusBadge
            status={participant.is_raffle_eligible ? 'eligible' : 'ineligible'}
            label={participant.is_raffle_eligible ? 'มีสิทธิ์' : 'สละสิทธิ์'}
          />
        );
      },
    },
    {
      key: 'actions' as const,
      header: 'การจัดการ',
      className: 'text-right',
      render: (item: any) => {
        const participant = item as Participant;
        return (
          <ActionButtons
            onEdit={canEdit() ? () => handleEdit(participant) : undefined}
            onDelete={canDelete() ? () => handleDeleteClick(participant) : undefined}
            canEdit={canEdit()}
            canDelete={canDelete()}
          />
        );
      },
    },
  ];

  const totalItems = paginationInfo?.count || participants.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={localValue}
              onChange={setLocalValue}
              onSubmit={handleSearchSubmit}
              placeholder="ค้นหาชื่อ-นามสกุล..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">เรียงตาม:</label>
            <select
              value={ordering}
              onChange={(e) => handleOrderingChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="hospital_id">ID โรงพยาบาล (น้อย-มาก)</option>
              <option value="-hospital_id">ID โรงพยาบาล (มาก-น้อย)</option>
              <option value="name">ชื่อ (A-Z)</option>
              <option value="-name">ชื่อ (Z-A)</option>
              <option value="created_at">วันที่สร้าง (เก่า-ใหม่)</option>
              <option value="-created_at">วันที่สร้าง (ใหม่-เก่า)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">แสดง:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <DataTable
        columns={columns}
        data={participants}
        loading={isLoading}
        emptyMessage={searchQuery ? 'ไม่พบรายชื่อที่ค้นหา' : 'ยังไม่มีรายชื่อในกิจกรรมนี้'}
        emptyTitle="ไม่พบข้อมูล"
        keyExtractor={(item) => item.id}
      />

      {/* Pagination */}
      {totalPages > 1 && paginationInfo && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Participant Form Modal */}
      <ParticipantFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSave={handleSave}
        participant={formModal.selectedItem}
        eventId={selectedEvent}
        orgId={user?.org_id}
      />

      {/* Import Modal */}
      <ParticipantImportModal
        isOpen={importModal.isOpen}
        onClose={importModal.close}
        eventId={selectedEvent}
        onSuccess={handleImportSuccess}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="ยืนยันการลบรายชื่อ"
        itemName={deleteModal.selectedItem?.name || ''}
      />
    </div>
  );
}
