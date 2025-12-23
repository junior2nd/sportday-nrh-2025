'use client';

import { memo } from 'react';
import { Pencil, Trash2, Info } from 'lucide-react';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  className?: string;
  editTitle?: string;
  deleteTitle?: string;
  viewTitle?: string;
}

export default memo(function ActionButtons({
  onEdit,
  onDelete,
  onView,
  canEdit = true,
  canDelete = true,
  canView = true,
  className = '',
  editTitle = 'แก้ไข',
  deleteTitle = 'ลบ',
  viewTitle = 'ดูรายละเอียด',
}: ActionButtonsProps) {
  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      {canView && onView && (
        <button
          onClick={onView}
          className="text-emerald-600 hover:text-emerald-700 p-2 font-medium inline-flex items-center bg-emerald-600/10 hover:bg-emerald-600/30 rounded-sm transition-colors"
          title={viewTitle}
          aria-label={viewTitle}
        >
          <Info className="w-5 h-5" />
        </button>
      )}
      {canEdit && onEdit && (
        <button
          onClick={onEdit}
          className="text-yellow-600 hover:text-yellow-700 p-2 font-medium inline-flex items-center bg-yellow-600/10 hover:bg-yellow-600/30 rounded-sm transition-colors"
          title={editTitle}
          aria-label={editTitle}
        >
          <Pencil className="w-5 h-5" />
        </button>
      )}
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 p-2 font-medium inline-flex items-center bg-red-600/10 hover:bg-red-600/30 rounded-sm transition-colors"
          title={deleteTitle}
          aria-label={deleteTitle}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

