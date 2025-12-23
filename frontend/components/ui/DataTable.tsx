'use client';

import { memo, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: (item: T) => string;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'ไม่พบข้อมูล',
  emptyTitle = 'ไม่พบข้อมูล',
  keyExtractor,
  onRowClick,
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.headerClassName || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => {
            const key = keyExtractor(item);
            const rowClass = rowClassName ? rowClassName(item) : '';
            const clickableClass = onRowClick ? 'cursor-pointer hover:bg-gray-50' : '';
            
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(item)}
                className={`${clickableClass} ${rowClass}`}
              >
                {columns.map((column) => {
                  const cellKey = `${key}-${String(column.key)}`;
                  const cellContent = column.render
                    ? column.render(item)
                    : (item[column.key] as ReactNode);
                  
                  return (
                    <td
                      key={cellKey}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.className || ''
                      }`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;

