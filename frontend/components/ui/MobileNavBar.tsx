'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, Trophy, RefreshCw } from 'lucide-react';

interface MobileNavBarProps {
  onRefresh?: () => void;
  showRefresh?: boolean;
}

export default function MobileNavBar({ onRefresh, showRefresh = false }: MobileNavBarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'หน้าหลัก',
      icon: Home,
    },
    {
      href: '/raffle/participants',
      label: 'ตรวจสอบ',
      icon: ListChecks,
    },
    {
      href: '/raffle/winners?raffle_event=1',
      label: 'รางวัล',
      icon: Trophy,
    },
  ];

  return (
    <>
      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === '/raffle/participants' && pathname?.startsWith('/raffle/participants')) ||
              (item.href.includes('/raffle/winners') && pathname?.startsWith('/raffle/winners'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Floating Refresh Button - อยู่ข้างบนปุ่มรางวัล (ปุ่มสุดท้าย) */}
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              className="absolute right-2 bottom-32 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 flex items-center justify-center z-10 active:scale-95"
              title="รีเฟรชข้อมูล"
              aria-label="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

