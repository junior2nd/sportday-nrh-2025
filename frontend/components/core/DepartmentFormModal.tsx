'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { coreApi, Department } from '@/lib/api/core';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>; // Called after successful save to refresh the list
  department?: Department | null;
  orgId?: number;
}

export default function DepartmentFormModal({
  isOpen,
  onClose,
  onSave,
  department,
  orgId,
}: DepartmentFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        is_active: department.is_active !== undefined ? department.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        is_active: true,
      });
    }
    setError('');
  }, [department, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อแผนก');
      return;
    }
    
    // Validate code format only if provided (alphanumeric with - or _)
    if (formData.code.trim()) {
      const codeRegex = /^[a-zA-Z0-9_-]+$/;
      if (!codeRegex.test(formData.code.trim())) {
        setError('รหัสแผนกต้องเป็นตัวอักษร ตัวเลข หรือเครื่องหมาย - และ _ เท่านั้น');
        return;
      }
    }
    
    if (!orgId) {
      setError('ไม่พบข้อมูลหน่วยงาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setIsSubmitting(true);
      const departmentData: any = {
        org: orgId,
        name: formData.name.trim(),
        is_active: formData.is_active,
      };
      
      // Only include code if provided and not empty
      // If empty, don't include the field at all - backend will set it to null
      const codeValue = formData.code?.trim();
      if (codeValue) {
        departmentData.code = codeValue;
      }
      // If code is empty, don't include it in the request

      // Save the department
      if (department) {
        await coreApi.updateDepartment(department.id, departmentData);
      } else {
        await coreApi.createDepartment(departmentData);
      }
      
      // Success - refresh the list and close modal
      await onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving department:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Check if it's actually an error (status code >= 400)
      const status = err.response?.status;
      if (status && status >= 200 && status < 300) {
        // Success response, but axios might have thrown an error
        // This shouldn't happen, but handle it gracefully
        await onSave();
        onClose();
        return;
      }
      
      // Extract error message from response
      const errorData = err.response?.data;
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
      
      if (errorData) {
        // Check for field-specific errors first
        const fieldErrors: string[] = [];
        if (errorData.code && Array.isArray(errorData.code)) {
          fieldErrors.push(`รหัสแผนก: ${errorData.code[0]}`);
        }
        if (errorData.name && Array.isArray(errorData.name)) {
          fieldErrors.push(`ชื่อแผนก: ${errorData.name[0]}`);
        }
        if (errorData.org && Array.isArray(errorData.org)) {
          fieldErrors.push(`หน่วยงาน: ${errorData.org[0]}`);
        }
        if (errorData.is_active && Array.isArray(errorData.is_active)) {
          fieldErrors.push(`สถานะ: ${errorData.is_active[0]}`);
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(', ');
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object') {
          // Try to get first error message from object
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
          } else {
            // If we can't parse, show the raw error
            errorMessage = JSON.stringify(errorData);
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={department ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}
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
            form="department-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อแผนก <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="กรอกชื่อแผนก"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            รหัสแผนก
          </label>
          <input
            type="text"
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            placeholder="เช่น IT, HR, FINANCE (ไม่บังคับ)"
          />
          <p className="mt-1 text-xs text-gray-500">
            รหัสแผนกต้องเป็นตัวอักษร ตัวเลข หรือเครื่องหมาย - และ _ เท่านั้น (ไม่บังคับ)
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">เปิดใช้งาน</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

