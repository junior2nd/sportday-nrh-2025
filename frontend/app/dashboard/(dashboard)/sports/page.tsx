'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { sportsApi, Tournament } from '@/lib/api/sports';
import { useRole } from '@/lib/hooks/useRole';
import { useHeader } from '@/components/ui/HeaderContext';
import { formatDateShort } from '@/lib/utils/format';
import { Trophy, Plus } from 'lucide-react';

export default function SportsPage() {
  const { canCreate, canEdit } = useRole();
  const { setHeader } = useHeader();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const pathname = usePathname();

  const canCreateValue = canCreate();
  const actionButton = useMemo(() => {
    if (!canCreateValue) return undefined;
    return (
      <Link
        href="/dashboard/sports/new"
        className="px-4 py-2 bg-emerald-600/20 text-emerald-600 rounded-sm hover:bg-emerald-700 hover:text-white transition-colors flex items-center space-x-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span>สร้างการแข่งขันใหม่</span>
      </Link>
    );
  }, [canCreateValue]);

  useEffect(() => {
    // Only update header when pathname actually changes
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      setHeader(
        'การแข่งขันกีฬา',
        'สร้างและจัดการการแข่งขันกีฬาต่างๆ',
        actionButton
      );
    }
    // Note: actionButton is intentionally NOT in dependencies to prevent infinite loops
    // It will be updated when pathname changes (page navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, setHeader]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await sportsApi.listTournaments();
      setTournaments(data);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชื่อการแข่งขัน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชนิดกีฬา
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รูปแบบ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tournaments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/sports/${tournament.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {tournament.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tournament.sport_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tournament.format_display}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tournament.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tournament.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tournament.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/sports/${tournament.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      ดู
                    </Link>
                    {canEdit() && (
                      <Link
                        href={`/sports/${tournament.id}/edit`}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        แก้ไข
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


