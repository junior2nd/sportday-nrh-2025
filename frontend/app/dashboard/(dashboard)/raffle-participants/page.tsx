'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { raffleApi, RaffleEvent } from '@/lib/api/raffle';
import { teamsApi, Participant } from '@/lib/api/teams';
import { useRole } from '@/lib/hooks/useRole';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { X, Check, Plus } from 'lucide-react';

export default function RaffleParticipantsPage() {
  const pathname = usePathname();
  const { canEdit } = useRole();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [raffleEvents, setRaffleEvents] = useState<RaffleEvent[]>([]);
  const [selectedRaffleEvent, setSelectedRaffleEvent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const lastPathnameRef = useRef<string | null>(null);

  // Load raffle events for the selected event
  useEffect(() => {
    if (selectedEvent) {
      loadRaffleEvents();
    } else {
      setRaffleEvents([]);
      setSelectedRaffleEvent(null);
    }
  }, [selectedEvent]);

  // Load participants when raffle event is selected
  useEffect(() => {
    if (selectedRaffleEvent && selectedEvent) {
      loadParticipants();
    } else {
      setParticipants([]);
      setLoading(false);
    }
  }, [selectedRaffleEvent, selectedEvent]);

  const loadRaffleEvents = async () => {
    if (!selectedEvent) return;
    try {
      const data = await raffleApi.listEvents({ event: selectedEvent });
      const raffleArray = Array.isArray(data) ? data : [];
      setRaffleEvents(raffleArray);
      // Auto-select first raffle event if available
      if (raffleArray.length > 0 && !selectedRaffleEvent) {
        setSelectedRaffleEvent(raffleArray[0].id);
      }
    } catch (err) {
      console.error('Error loading raffle events:', err);
      setRaffleEvents([]);
    }
  };

  const loadParticipants = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ffeb9d28-10de-4de2-8976-815df9fa8c0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/(dashboard)/raffle-participants/page.tsx:61',message:'loadParticipants called',data:{selectedRaffleEvent,selectedRaffleEventType:typeof selectedRaffleEvent,isNull:selectedRaffleEvent===null,isUndefined:selectedRaffleEvent===undefined,selectedEvent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!selectedRaffleEvent) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ffeb9d28-10de-4de2-8976-815df9fa8c0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/(dashboard)/raffle-participants/page.tsx:63',message:'Early return - no selectedRaffleEvent',data:{selectedRaffleEvent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    try {
      setLoading(true);
      setError('');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ffeb9d28-10de-4de2-8976-815df9fa8c0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/(dashboard)/raffle-participants/page.tsx:68',message:'Calling listEligibleParticipants',data:{selectedRaffleEvent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const data = await raffleApi.listEligibleParticipants(selectedRaffleEvent);
      // API returns { success: true, count: number, results: Participant[] }
      const participantsList = (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results))
        ? data.results
        : (Array.isArray(data) ? data : []);
      setParticipants(participantsList);
    } catch (err: any) {
      console.error('Error loading participants:', err);
      setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลได้');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEligible = async (participant: Participant) => {
    if (!canEdit()) return;
    
    const newEligible = !participant.is_raffle_eligible;
    setTogglingIds(prev => new Set(prev).add(participant.id));
    
    try {
      await teamsApi.toggleRaffleEligible(participant.id, newEligible);
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participant.id 
          ? { ...p, is_raffle_eligible: newEligible }
          : p
      ));
    } catch (err: any) {
      console.error('Error toggling eligibility:', err);
      setError(err.response?.data?.detail || 'ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(participant.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      setHeader(
        'ผู้มีสิทธิ์รับรางวัล',
        'จัดการสิทธิรับรางวัลของผู้เข้าร่วมกิจกรรม',
        undefined
      );
    }
  }, [pathname, setHeader]);

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
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

      {/* Raffle Event Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เลือกการจับสลาก
        </label>
        <select
          value={selectedRaffleEvent || ''}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedRaffleEvent(value ? Number(value) : null);
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- เลือกการจับสลาก --</option>
          {raffleEvents.map((raffle) => (
            <option key={raffle.id} value={raffle.id}>
              {raffle.name}
            </option>
          ))}
        </select>
      </div>

      {/* Participants Table */}
      {!selectedRaffleEvent ? (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          กรุณาเลือกการจับสลากเพื่อดูรายชื่อผู้มีสิทธิ์รับรางวัล
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ทีม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะสิทธิ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    ยังไม่มีผู้เข้าร่วมในกิจกรรมนี้
                  </td>
                </tr>
              ) : (
                participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.department_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.team_name ? (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: participant.team_color_code || '#ccc' }}
                          ></div>
                          <span>{participant.team_name}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        participant.is_raffle_eligible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {participant.is_raffle_eligible ? 'มีสิทธิ์' : 'สละสิทธิ์'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEdit() && (
                        <button
                          onClick={() => handleToggleEligible(participant)}
                          disabled={togglingIds.has(participant.id)}
                          className={`p-2 font-medium inline-flex items-center rounded-sm mr-2 transition-colors ${
                            participant.is_raffle_eligible
                              ? 'text-red-600 hover:text-red-700 bg-red-600/10 hover:bg-red-600/30'
                              : 'text-green-600 hover:text-green-700 bg-green-600/10 hover:bg-green-600/30'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={participant.is_raffle_eligible ? 'ตัดสิทธิ' : 'คืนสิทธิ'}
                        >
                          {togglingIds.has(participant.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : participant.is_raffle_eligible ? (
                            <X className="w-5 h-5" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
