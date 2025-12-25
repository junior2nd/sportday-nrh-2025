'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Participant, teamsApi } from '@/lib/api/teams';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { useParticipants, useDeleteParticipant, useResetAllEligibility } from '@/lib/hooks/data/useParticipants';
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
import Modal from '@/components/ui/Modal';
import { Plus, Upload, RotateCcw, AlertTriangle, Printer, FileText, Trash2 } from 'lucide-react';

export default function ParticipantsPage() {
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const pathname = usePathname();
  const lastPathnameRef = useRef<string | null>(null);
  const lastActionButtonDepsRef = useRef<{ canCreate: boolean; selectedEvent: number | null } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [departments, setDepartments] = useState<Array<{ name: string; id?: number }>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [ordering, setOrdering] = useState<string>('hospital_id');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data: participantsResponse, isLoading, error } = useParticipants({
    event: selectedEvent || undefined,
    search: searchQuery || undefined,
    department_name: departmentFilter || undefined, // Backend needs to support this filter
    ordering,
    page: currentPage,
    page_size: pageSize,
  });

  const participants = useMemo(() => {
    if (!participantsResponse) return [];
    return extractResults<Participant>(participantsResponse);
  }, [participantsResponse]);

  // Load departments from API endpoint
  useEffect(() => {
    const loadDepartments = async () => {
      if (!selectedEvent) {
        setDepartments([]);
        return;
      }

      try {
        setLoadingDepartments(true);
        // Fetch departments from dedicated API endpoint
        const deptList = await teamsApi.listParticipantDepartments(selectedEvent);
        
        // Format for dropdown (use name as both key and value)
        const formattedDepts = deptList.map(dept => ({
          name: dept.name,
          id: dept.id,
        }));
        
        setDepartments(formattedDepts);
      } catch (err) {
        console.error('Error loading departments:', err);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [selectedEvent]);

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
  const deleteAllModal = useModal();
  const importModal = useModal();
  const resetModal = useModal();
  const deleteMutation = useDeleteParticipant();
  const resetEligibilityMutation = useResetAllEligibility();
  const [deletingAll, setDeletingAll] = useState(false);

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

  const handleResetEligibilityClick = useCallback(() => {
    resetModal.open();
  }, [resetModal]);

  const handleDeleteAllClick = useCallback(() => {
    deleteAllModal.open();
  }, [deleteAllModal]);

  const handleDeleteAll = useCallback(async (reason: string) => {
    if (!selectedEvent || !participants || participants.length === 0) return;
    
    try {
      setDeletingAll(true);
      // Delete all participants one by one to avoid overwhelming the server
      let successCount = 0;
      let errorCount = 0;
      
      for (const participant of participants) {
        try {
          await deleteMutation.mutateAsync({
            id: participant.id,
            reason: `ลบทั้งหมด: ${reason}`,
          });
          successCount++;
        } catch (error) {
          console.error(`Error deleting participant ${participant.id}:`, error);
          errorCount++;
        }
      }
      
      deleteAllModal.close();
      setCurrentPage(1);
      
      if (errorCount > 0) {
        alert(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${errorCount} รายการ`);
      }
    } catch (error) {
      console.error('Error deleting all participants:', error);
      alert('เกิดข้อผิดพลาดในการลบรายชื่อ');
    } finally {
      setDeletingAll(false);
    }
  }, [selectedEvent, participants, deleteMutation, deleteAllModal]);

  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const handleResetEligibility = useCallback(async () => {
    if (!selectedEvent) return;
    
    // Validation
    // Get password from environment variable (exposed via next.config.ts)
    const requiredPassword = process.env.NEXT_PUBLIC_RESET_PASSWORD || '';
    if (!requiredPassword) {
      console.error('NEXT_PUBLIC_RESET_PASSWORD is not set. Value:', process.env.NEXT_PUBLIC_RESET_PASSWORD);
      setResetError('ไม่ได้ตั้งค่ารหัสผ่าน กรุณาตรวจสอบไฟล์ .env และ restart dev server');
      return;
    }
    if (!resetPassword.trim()) {
      setResetError('กรุณากรอกรหัสผ่าน');
      return;
    }
    if (resetPassword.trim() !== requiredPassword) {
      setResetError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    try {
      setResetError('');
      await resetEligibilityMutation.mutateAsync(selectedEvent);
      setResetPassword('');
      resetModal.close();
      setCurrentPage(1);
    } catch (error) {
      console.error('Error resetting eligibility:', error);
      setResetError('เกิดข้อผิดพลาดในการรีเซ็ต');
    }
  }, [selectedEvent, resetEligibilityMutation, resetModal, resetPassword]);

  const handleOrderingChange = useCallback((newOrdering: string) => {
    setOrdering(newOrdering);
    setCurrentPage(1);
  }, []);

  const handleDepartmentFilterChange = useCallback((dept: string) => {
    setDepartmentFilter(dept);
    setCurrentPage(1);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!selectedEvent) return;
    
    try {
      setExporting(true);
      const blob = await teamsApi.exportParticipantsExcel({
        event: selectedEvent,
        search: searchQuery || undefined,
        department_name: departmentFilter || undefined,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `participants_${selectedEvent}_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  }, [selectedEvent, searchQuery, departmentFilter]);

  const handlePrintPDF = useCallback(async () => {
    if (!selectedEvent) return;
    
    try {
      setExporting(true);
      const htmlContent = await teamsApi.exportParticipantsPDF({
        event: selectedEvent,
        search: searchQuery || undefined,
        department_name: departmentFilter || undefined,
      });
      
      // Create new window with HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('กรุณาอนุญาตให้เปิด popup window');
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then show print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (err: any) {
      console.error('Error exporting PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  }, [selectedEvent, searchQuery, departmentFilter]);

  const canCreateValue = canCreate();
  const actionButton = useMemo(() => {
    if (!canCreateValue || !selectedEvent) return undefined;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDeleteAllClick}
          className="px-4 py-2 bg-red-600/20 text-red-600 rounded-sm hover:bg-red-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
          disabled={deletingAll || !participants || participants.length === 0}
        >
          <Trash2 className="w-5 h-5" />
          <span>ลบทั้งหมด</span>
        </button>
        <button
          onClick={handleResetEligibilityClick}
          className="px-4 py-2 bg-orange-600/20 text-orange-600 rounded-sm hover:bg-orange-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
          disabled={resetEligibilityMutation.isPending}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset สิทธิทั้งหมด</span>
        </button>
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
  }, [canCreateValue, selectedEvent, handleCreate, handleImport, handleResetEligibilityClick, handleDeleteAllClick, resetEligibilityMutation.isPending, deletingAll, participants]);

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
      setDepartmentFilter(''); // Reset department filter when event changes
    }
  }, [selectedEvent]);

  // Reset to page 1 when department filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter]);

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
      header: 'หน่วยงาน',
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
            label={participant.is_raffle_eligible ? 'มีสิทธิ์' : 'ได้รางวัลแล้ว'}
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

  // Use server-side pagination count
  const totalItems = paginationInfo?.count || participants.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible when printing */}
      <div className="print-header hidden print:block">
        <h1 className="text-2xl font-bold mb-2">รายชื่อผู้เข้าร่วมกิจกรรม</h1>
        {searchQuery && (
          <p className="text-sm">ค้นหา: {searchQuery}</p>
        )}
        {departmentFilter && (
          <p className="text-sm">หน่วยงาน: {departmentFilter}</p>
        )}
        <p className="text-sm">วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-4 print:hidden space-y-4">
        {/* Row 1: Search and Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <SearchInput
              value={localValue}
              onChange={setLocalValue}
              onSubmit={handleSearchSubmit}
              placeholder="ค้นหาชื่อ-นามสกุล..."
            />
          </div>
          
          {/* Print/Export Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrintPDF}
              disabled={exporting}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="พิมพ์/Preview PDF"
            >
              <Printer className="w-5 h-5" />
              <span>{exporting ? 'กำลังสร้าง...' : 'พิมพ์/Preview'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="บันทึกเป็น Excel"
            >
              <FileText className="w-5 h-5" />
              <span>{exporting ? 'กำลังสร้าง...' : 'บันทึก Excel'}</span>
            </button>
          </div>
        </div>
        
        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">หน่วยงาน:</label>
            <select
              value={departmentFilter}
              onChange={(e) => handleDepartmentFilterChange(e.target.value)}
              disabled={loadingDepartments}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- ทุกหน่วยงาน --</option>
              {loadingDepartments ? (
                <option disabled>กำลังโหลด...</option>
              ) : (
                departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">เรียงตาม:</label>
            <select
              value={ordering}
              onChange={(e) => handleOrderingChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              className="px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-24"
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
        emptyMessage={searchQuery || departmentFilter ? 'ไม่พบรายชื่อที่ค้นหา' : 'ยังไม่มีรายชื่อในกิจกรรมนี้'}
        emptyTitle="ไม่พบข้อมูล"
        keyExtractor={(item) => item.id}
      />

      {/* Pagination */}
      {totalPages > 1 && paginationInfo && (
        <div className="print:hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Print Footer - Only visible when printing */}
      <div className="print-footer hidden print:block">
        <p>พิมพ์จากระบบ NRSport - หน้า 1</p>
      </div>

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

      {/* Delete All Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteAllModal.isOpen}
        onClose={deleteAllModal.close}
        onConfirm={handleDeleteAll}
        title="ยืนยันการลบรายชื่อทั้งหมด"
        itemName={`${participants.length} รายชื่อ`}
      />

      {/* Reset Eligibility Confirm Modal */}
      <Modal
        isOpen={resetModal.isOpen}
        onClose={() => {
          setResetPassword('');
          setResetError('');
          resetModal.close();
        }}
        title="Reset สิทธิจับรางวัลทั้งหมด"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setResetPassword('');
                setResetError('');
                resetModal.close();
              }}
              disabled={resetEligibilityMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleResetEligibility}
              disabled={resetEligibilityMutation.isPending || !resetPassword.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetEligibilityMutation.isPending ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-orange-50 p-3 rounded-sm">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                คุณแน่ใจหรือไม่ว่าต้องการ Reset สิทธิจับรางวัลทั้งหมดให้เป็น "มีสิทธิ์" สำหรับกิจกรรมนี้?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                การดำเนินการนี้จะตั้งค่า is_raffle_eligible เป็น true สำหรับผู้เข้าร่วมทั้งหมดในกิจกรรมนี้
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              id="reset-password"
              type="password"
              value={resetPassword}
              onChange={(e) => {
                setResetPassword(e.target.value);
                setResetError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="กรุณากรอกรหัสผ่าน"
              disabled={resetEligibilityMutation.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              กรุณากรอกรหัสผ่านเพื่อยืนยันการรีเซ็ต
            </p>
            {resetError && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {resetError}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
