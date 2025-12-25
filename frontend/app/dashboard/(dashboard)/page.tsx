'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { dashboardApi, DashboardData } from '@/lib/api/dashboard';
import StatsCard from '@/components/dashboard/StatsCard';
import { useRole } from '@/lib/hooks/useRole';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { raffleApi, Prize } from '@/lib/api/raffle';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Gift,
  Package
} from 'lucide-react';

export default function DashboardPage() {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoading, setPrizesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadPrizes();
    } else {
      setPrizes([]);
    }
  }, [selectedEvent]);

  const isAdminValue = isAdmin();
  const actionButton = useMemo(() => {
    if (!isAdminValue) return undefined;
    return (
      <Link
        href="/dashboard/events"
        className="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-sm"
      >
        <Calendar className="w-5 h-5" />
        <span>จัดการกิจกรรม</span>
      </Link>
    );
  }, [isAdminValue]);

  useEffect(() => {
    // Only update header when pathname actually changes
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      setHeader(
        'Dashboard',
        'ภาพรวมระบบจัดการกิจกรรม',
        actionButton
      );
    }
    // Note: actionButton is intentionally NOT in dependencies to prevent infinite loops
    // It will be updated when pathname changes (page navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setHeader]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const loadPrizes = async () => {
    if (!selectedEvent) return;

    try {
      setPrizesLoading(true);
      // Get raffle events for this event
      const raffleEvents = await raffleApi.listEvents({ event: selectedEvent });
      if (raffleEvents.length > 0) {
        // Get prizes for the first raffle event
        const prizesData = await raffleApi.listPrizes({ raffle_event: raffleEvents[0].id });
        setPrizes(Array.isArray(prizesData) ? prizesData : []);
      } else {
        setPrizes([]);
      }
    } catch (err) {
      console.error('Error loading prizes:', err);
      setPrizes([]);
    } finally {
      setPrizesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Default values to prevent undefined errors
  const events = dashboardData.events || { total: 0, active: 0, completed: 0 };
  const teams = dashboardData.teams || { participants: 0, teams: 0, team_members: 0 };
  const raffle = dashboardData.raffle || { events: 0, prizes: 0, winners: 0 };

  // Calculate remaining prizes
  const totalQuantity = prizes.reduce((sum, prize) => sum + prize.quantity, 0);
  const totalSelected = prizes.reduce((sum, prize) => sum + (prize.selected_count || 0), 0);
  const totalRemaining = totalQuantity - totalSelected;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="กิจกรรมทั้งหมด"
          value={events.total}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="ได้รางวัลไปแล้ว"
          value={raffle.winners}
          icon={Gift}
          color="purple"
        />
        <StatsCard
          title="เหลืออีก"
          value={totalRemaining}
          icon={Package}
          color="orange"
        />
        <StatsCard
          title="ผู้เข้าร่วม"
          value={teams.participants}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Prize Status Summary */}
      {selectedEvent ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะรางวัล</h3>
          {prizesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : prizes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map((prize) => {
                const remaining = prize.quantity - prize.selected_count;
                const percentage = prize.quantity > 0 ? (prize.selected_count / prize.quantity) * 100 : 0;
                return (
                  <div
                    key={prize.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{prize.name}</h4>
                      <span className={`text-sm font-semibold ${remaining === 0 ? 'text-red-600' : remaining <= prize.quantity * 0.2 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                        เหลือ {remaining}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>ได้ไปแล้ว: {prize.selected_count}</span>
                        <span>ทั้งหมด: {prize.quantity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${remaining === 0 ? 'bg-red-500' : remaining <= prize.quantity * 0.2 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {percentage.toFixed(0)}% ครบแล้ว
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>ยังไม่มีรางวัลสำหรับกิจกรรมนี้</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะรางวัล</h3>
          <div className="text-center py-8 text-gray-500">
            <p>กรุณาเลือกกิจกรรมจากหน้า Event Selection เพื่อดูสถานะรางวัล</p>
          </div>
        </div>
      )}
    </div>
  );
}

