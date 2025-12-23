'use client';

import { memo } from 'react';

interface PublicFooterProps {
  className?: string;
  copyrightText?: string;
}

export default memo(function PublicFooter({
  className = '',
  copyrightText = '© 2025 NangRong Hospital, Buriram, TH.',
}: PublicFooterProps) {
  return (
    <footer className={`bg-white border-t border-gray-200 mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center text-gray-600">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
});

