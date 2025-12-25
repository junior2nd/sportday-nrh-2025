'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sportsApi, Match } from '@/lib/api/sports';
import { useRole } from '@/lib/hooks/useRole';

export default function ScoreEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const { canScore } = useRole();
  const [match, setMatch] = useState<Match | null>(null);
  const [scores, setScores] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canScore()) {
      router.push('/dashboard/sports');
      return;
    }

    if (matchId) {
      loadMatch(Number(matchId));
    }
  }, [matchId, canScore, router]);

  const loadMatch = async (id: number) => {
    try {
      setLoading(true);
      const data = await sportsApi.getMatch(id);
      setMatch(data);
      
      // Initialize scores from existing match teams
      const initialScores: Record<number, any> = {};
      data.match_teams.forEach((mt) => {
        initialScores[mt.team] = mt.score || {};
      });
      setScores(initialScores);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (teamId: number, field: string, value: any) => {
    setScores((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;

    try {
      setSubmitting(true);
      setError('');
      await sportsApi.updateScore(match.id, scores);
      alert('บันทึกคะแนนสำเร็จ');
      router.push(`/dashboard/sports`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ไม่สามารถบันทึกคะแนนได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบข้อมูลการแข่งขัน</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ลงคะแนนการแข่งขัน</h1>
        <p className="text-gray-600 mt-2">
          {match.tournament_name} - รอบที่ {match.round_number} นัดที่ {match.match_number}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {match.match_teams.map((matchTeam) => (
          <div key={matchTeam.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <div
                className="w-6 h-6 rounded-full mr-3"
                style={{ backgroundColor: matchTeam.team_color_code }}
              ></div>
              <h3 className="text-lg font-semibold" style={{ color: matchTeam.team_color_code }}>
                {matchTeam.team_color_name}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คะแนน
                </label>
                <input
                  type="number"
                  min="0"
                  value={scores[matchTeam.team]?.value ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleScoreChange(matchTeam.team, 'value', null);
                    } else {
                      const numValue = Number(inputValue);
                      if (!isNaN(numValue)) {
                        handleScoreChange(matchTeam.team, 'value', numValue);
                      }
                    }
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกคะแนน"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
          </button>
        </div>
      </form>
    </div>
  );
}


