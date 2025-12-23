'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { dashboardApi, DashboardData } from '@/lib/api/dashboard';
import StatsCard from '@/components/dashboard/StatsCard';
import { useRole } from '@/lib/hooks/useRole';
import { useHeader } from '@/components/ui/HeaderContext';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Palette, 
  Trophy, 
  BarChart3, 
  Gift, 
  Activity 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, canEdit } = useRole();
  const { setHeader } = useHeader();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

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
  const sports = dashboardData.sports || { tournaments: 0, matches: 0, completed_matches: 0 };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="กิจกรรมทั้งหมด"
          value={events.total}
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="ผู้เข้าร่วม"
          value={teams.participants}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="ทีม"
          value={teams.teams}
          icon={Palette}
          color="purple"
        />
        <StatsCard
          title="การแข่งขัน"
          value={sports.tournaments}
          icon={Trophy}
          color="indigo"
          className="hidden"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="mr-2 w-5 h-5" />
            สถานะกิจกรรม
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">กำลังดำเนินการ</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                {events.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เสร็จสิ้น</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                {events.completed}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Gift className="mr-2 w-5 h-5" />
            จับสลาก
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">การจับสลาก</span>
              <span className="font-semibold text-gray-900">{raffle.events}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ผู้ชนะ</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                {raffle.winners}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="mr-2 w-5 h-5" />
            กีฬา
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">นัดแข่งขัน</span>
              <span className="font-semibold text-gray-900">{sports.matches}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เสร็จสิ้น</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                {sports.completed_matches}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {canEdit() && (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดการด่วน</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/events"
              className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-center font-medium flex items-center justify-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>จัดการกิจกรรม</span>
            </Link>
            <Link
              href="/dashboard/teams"
              className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>จัดการทีม</span>
            </Link>
            <Link
              href="/dashboard/raffle"
              className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-center font-medium flex items-center justify-center space-x-2"
            >
              <Gift className="w-5 h-5" />
              <span>จัดการจับสลาก</span>
            </Link>
            <Link
              href="/dashboard/sports"
              className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-center font-medium flex items-center justify-center space-x-2 hidden"
            >
              <Trophy className="w-5 h-5" />
              <span>จัดการกีฬา</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

