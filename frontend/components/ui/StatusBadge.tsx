'use client';

import { memo } from 'react';

export type StatusType = 'active' | 'completed' | 'draft' | 'cancelled' | 'scheduled' | 'in_progress' | 'eligible' | 'ineligible';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  in_progress: { bg: 'bg-orange-100', text: 'text-orange-800' },
  eligible: { bg: 'bg-green-100', text: 'text-green-800' },
  ineligible: { bg: 'bg-red-100', text: 'text-red-800' },
};

const defaultStatusConfig = { bg: 'bg-gray-100', text: 'text-gray-800' };

export default memo(function StatusBadge({
  status,
  label,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status] || defaultStatusConfig;
  const displayLabel = label || status;

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} ${className}`}
    >
      {displayLabel}
    </span>
  );
});

