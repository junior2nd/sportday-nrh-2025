'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
}

export default memo(function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  showPageNumbers = true,
  maxPageNumbers = 5,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return Array.from({ length: maxPageNumbers }, (_, i) => i + 1);
    }

    if (currentPage >= totalPages - 2) {
      return Array.from(
        { length: maxPageNumbers },
        (_, i) => totalPages - maxPageNumbers + i + 1
      );
    }

    return Array.from(
      { length: maxPageNumbers },
      (_, i) => currentPage - 2 + i
    );
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between bg-white px-4 py-3 border border-gray-100 rounded-sm ${className}`}>
      <div className="text-sm text-gray-700">
        แสดง <span className="font-medium">{startItem}</span> ถึง{' '}
        <span className="font-medium">{endItem}</span> จาก{' '}
        <span className="font-medium">{totalItems}</span> รายการ
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          aria-label="ก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
          ก่อนหน้า
        </button>
        
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                  currentPage === pageNum
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`หน้า ${pageNum}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
        
        <span className="text-sm text-gray-700 px-2">
          หน้า {currentPage} จาก {totalPages}
        </span>
        
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          aria-label="ถัดไป"
        >
          ถัดไป
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

