'use client';

import { memo, ReactNode } from 'react';
import Link from 'next/link';
import Logo from './Logo';

interface PublicHeaderProps {
  loginHref?: string;
  loginText?: string;
  rightContent?: ReactNode;
  className?: string;
}

export default memo(function PublicHeader({
  loginHref = '/dashboard/login',
  loginText = 'เข้าสู่ระบบ',
  rightContent,
  className = '',
}: PublicHeaderProps) {
  return (
    <header className={`pt-4 hidden md:block ${className}`}>
      <div className="max-w-6xl bg-white/50 border border-gray-100 shadow-lg mx-3 sm:mx-auto px-4 sm:px-6 lg:px-6 py-2.5 rounded-full">
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <div className='flex gap-4 items-center'>
            {rightContent || (
              <Link
                href={loginHref}
                className="px-4 py-2 bg-linear-to-t from-emerald-700 to-emerald-500 text-white rounded-full hover:bg-emerald-700 transition-colors"
              >
                {loginText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

