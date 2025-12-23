'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { coreApi, Department } from '@/lib/api/core';
import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHeader } from '@/components/ui/HeaderContext';
import DepartmentFormModal from '@/components/core/DepartmentFormModal';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function DepartmentsPage() {
  const { canCreate, canEdit, canDelete } = useRole();
  const { user } = useAuth();
  const { setHeader } = useHeader();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedDepartment(null);
    setIsFormModalOpen(true);
  }, []);

  const canCreateValue = canCreate();
  const actionButton = useMemo(() => {
    if (!canCreateValue) return undefined;
    return (
      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span>เพิ่มแผนก</span>
      </button>
    );
  }, [canCreateValue, handleCreate]);

  useEffect(() => {
    setHeader(
      'จัดการแผนก',
      'จัดการแผนกในหน่วยงาน',
      actionButton
    );
  }, [pathname, setHeader, actionButton]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await coreApi.listDepartments({ is_active: true });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading departments:', err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    // This is called after the modal has already saved the data
    // Just refresh the list
    await loadDepartments();
  };

  const handleDelete = async (reason: string) => {
    if (!selectedDepartment) return;
    try {
      await coreApi.deleteDepartment(selectedDepartment.id, reason);
      loadDepartments();
    } catch (err: any) {
      throw err; // Re-throw to let modal handle error display
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อแผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัสแผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    ยังไม่มีแผนก
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {department.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {department.is_active ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEdit() && (
                        <>
                          <button
                            onClick={() => handleEdit(department)}
                            className="text-yellow-600 hover:text-yellow-700 p-2 font-medium inline-flex items-center bg-yellow-600/10 hover:bg-yellow-600/30 rounded-sm mr-2"
                            title="แก้ไข"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          {canDelete() && (
                            <button
                              onClick={() => handleDeleteClick(department)}
                              className="text-red-600 hover:text-red-700 p-2 font-medium inline-flex items-center bg-red-600/10 hover:bg-red-600/30 rounded-sm"
                              title="ลบ"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedDepartment(null);
        }}
        onSave={handleSave}
        department={selectedDepartment}
        orgId={user?.org_id}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleDelete}
        title="ยืนยันการลบแผนก"
        itemName={selectedDepartment?.name || ''}
      />
    </div>
  );
}

