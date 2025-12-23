'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEvent } from '@/lib/contexts/EventContext';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { HeaderProvider } from '@/components/ui/HeaderContext';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, logout } = useAuth();
  const { selectedEvent } = useEvent();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/dashboard/login');
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/dashboard/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect to event selection if no event selected (except for event-selection page itself)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !selectedEvent && pathname !== '/dashboard/event-selection') {
      router.replace('/dashboard/event-selection');
    }
  }, [isLoading, isAuthenticated, selectedEvent, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <HeaderProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main key={pathname} className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}

