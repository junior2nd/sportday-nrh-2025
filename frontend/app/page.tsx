'use client';

import Link from 'next/link';
import { ListChecks, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import PublicHeader from '@/components/ui/PublicHeader';
import PublicFooter from '@/components/ui/PublicFooter';
import MobileNavBar from '@/components/ui/MobileNavBar';
import MobileHeader from '@/components/ui/MobileHeader';
import Modal from '@/components/ui/Modal';
import { teamsApi, Participant } from '@/lib/api/teams';
import { raffleApi, RaffleParticipant } from '@/lib/api/raffle';

export default function LandingPage() {
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checking, setChecking] = useState(false);
  
  // Winner check states
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winnerModalType, setWinnerModalType] = useState<'success' | 'not-found' | null>(null);
  const [winnerName, setWinnerName] = useState('');
  const [winnerInfo, setWinnerInfo] = useState<RaffleParticipant | null>(null);
  const [checkingWinner, setCheckingWinner] = useState(false);

  useEffect(() => {
    const fetchParticipantCount = async () => {
      try {
        setLoading(true);
        // Get participant count from API
        // Using page_size=1 to minimize data transfer, we only need the count
        const response = await teamsApi.listParticipants({ page: 1, page_size: 1 });

        if (response && typeof response === 'object' && 'count' in response) {
          setParticipantCount(response.count);
        } else if (Array.isArray(response)) {
          setParticipantCount(response.length);
        } else {
          setParticipantCount(0);
        }
      } catch (error) {
        console.error('Error fetching participant count:', error);
        setParticipantCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantCount();
  }, []);

  const handleCheckName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (!name || name.trim() === '') {
      return;
    }

    setChecking(true);
    const searchTerm = name.trim();
    setSearchQuery(searchTerm);

    try {
      // Search for participants by name (supports partial match, handles titles/prefixes)
      const response = await teamsApi.listParticipants({
        search: searchTerm,
        page_size: 50, // Get enough results to display
      });

      let participants: Participant[] = [];
      if (response && typeof response === 'object' && 'results' in response) {
        participants = response.results;
      } else if (Array.isArray(response)) {
        participants = response;
      }

      // Filter only eligible participants
      const eligibleParticipants = participants.filter(p => p.is_raffle_eligible);
      
      setSearchResults(eligibleParticipants);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error checking participant:', error);
      setSearchResults([]);
      setIsModalOpen(true);
    } finally {
      setChecking(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleCheckWinner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('winner_name') as string;

    if (!name || name.trim() === '') {
      return;
    }

    setCheckingWinner(true);
    setWinnerName(name.trim());

    try {
      // Search for winner by name - using raffle_event=1 as default, can be made configurable
      const response = await raffleApi.listWinnersPublic({
        search: name.trim(),
        page_size: 100,
        raffle_event: 1, // Default to event 1, can be made dynamic
      });

      // Check if any winner matches the name exactly
      const foundWinner = response.results?.find(
        (w) => w.participant_name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (foundWinner) {
        setWinnerModalType('success');
        setWinnerInfo(foundWinner);
      } else {
        setWinnerModalType('not-found');
        setWinnerInfo(null);
      }
      setIsWinnerModalOpen(true);
    } catch (error) {
      console.error('Error checking winner:', error);
      setWinnerModalType('not-found');
      setWinnerInfo(null);
      setIsWinnerModalOpen(true);
    } finally {
      setCheckingWinner(false);
    }
  };

  const closeWinnerModal = () => {
    setIsWinnerModalOpen(false);
    setWinnerModalType(null);
    setWinnerName('');
    setWinnerInfo(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-t from-emerald-100/60 to-white flex flex-col pb-16 md:pb-0">
      {/* Header - Desktop only */}
      <PublicHeader />
      
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Mobile Navigation Bar */}
      <MobileNavBar />
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 grow">
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0'>
          <div className="flex justify-center items-center">
            <img
              src="/images/HNY.png"
              alt="Happy New Year"
              className="mx-auto w-full max-w-sm md:max-w-none h-auto"
            />
          </div>
          <div className='flex flex-col justify-center text-center'>
            {/* โลโก้โรงพยาบาล */}
            <div className="mb-4 md:mb-6 flex justify-center">
              <img
                src="/images/Logonrh.png"
                alt="โลโก้โรงพยาบาลนางรอง"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-700 mb-2 px-2">
              งานจับสลากปีใหม่ 2569
            </h2>
            <p className='mb-3 md:mb-4 text-zinc-600 text-lg md:text-xl'>โรงพยาบาลนางรอง</p>

            {/* ข้อความต้อนรับ */}
            <p className="text-sm sm:text-base md:text-lg text-zinc-500 mb-6 md:mb-8 px-4 md:px-8">
              ขอต้อนรับทุกท่านเข้าร่วมกิจกรรมจับสลากแห่งความสุข<br />
              เพื่อส่งท้ายปีเก่าและต้อนรับปีใหม่ด้วยรอยยิ้มและความหวัง
            </p>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 md:mb-8 shadow-xl py-4 md:py-8 mx-4 sm:mx-8 md:mx-16 rounded-full border border-gray-100">
              จำนวนผู้ลงทะเบียน{' '}
              <span className='bg-linear-to-t from-emerald-600 to-emerald-400 border border-emerald-600 px-4 md:px-8 text-white font-bold text-2xl sm:text-3xl md:text-4xl shadow-xl rounded-lg mx-1 md:mx-2'>
                {loading ? '...' : participantCount !== null ? participantCount.toLocaleString('th-TH') : '0'}
              </span>{' '}
              คน
            </p>
          </div>
        </div>
        <div className='bg-linear-to-r from-emerald-700 to-emerald-500/80 rounded-xl shadow-xl text-white overflow-hidden flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0'>
          <div className="shrink-0 hidden md:block">
            <img
              src="/images/checklist.png"
              alt="ตรวจสอบรายชื่อ"
              className="h-72 w-auto rounded-l-lg shadow-lg"
            />
          </div>
          <div className="flex-1 p-4 md:pl-4 md:pr-6 w-full">
            <h3 className='text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-center md:text-left'>ตรวจสอบรายชื่อผู้ลงทะเบียน</h3>
            <p className='text-sm sm:text-base text-emerald-50 mb-4 text-center md:text-left'>
              คุณสามารถตรวจสอบรายชื่อผู้ที่ลงทะเบียนเข้าร่วมงานจับสลากปีใหม่ 2569<br className="hidden sm:block" />
              โดยสามารถค้นหาด้วยชื่อเพื่อยืนยันว่าคุณได้ลงทะเบียนเรียบร้อยแล้วและมีสิทธิ์์เข้าร่วมการจับสลาก
            </p>
            <form
              onSubmit={handleCheckName}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 w-full"
            >
              <input
                type="text"
                name="name"
                placeholder="กรุณาใส่ชื่อเพื่อตรวจสอบ..."
                className="flex-1 w-full sm:w-auto px-4 py-2 sm:rounded-l-full rounded-full sm:rounded-r-none bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                required
                disabled={checking}
              />
              <button
                type="submit"
                disabled={checking}
                className="px-4 py-2 sm:rounded-r-full rounded-full sm:rounded-l-none bg-yellow-400 text-emerald-900 font-semibold hover:bg-yellow-500 transition-colors text-base sm:text-lg w-full sm:w-auto sm:min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
              </button>
            </form>
            <Link 
              href="/raffle/participants"
              className='mt-4 text-emerald-50 hover:text-white underline underline-offset-1 transition-colors text-center md:text-left block'
            >
              ตรวจสอบข้อมูลอย่างละเอียด
            </Link>
          </div>
        </div>
        
        {/* Winner Check Section */}
        <div className='bg-linear-to-r from-amber-600 to-yellow-500/80 rounded-xl shadow-xl text-white overflow-hidden flex flex-col md:flex-row items-center gap-4 mt-6'>
          <div className="shrink-0 hidden md:block">
            <img
              src="/images/check.png"
              alt="ตรวจสอบผู้ได้รับรางวัล"
              className="h-72 w-auto rounded-l-lg shadow-lg"
            />
          </div>
          <div className="flex-1 p-4 md:pl-4 md:pr-6 w-full">
            <h3 className='text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-center md:text-left flex items-center gap-2'>
              ตรวจสอบรายชื่อผู้ได้รับรางวัล
            </h3>
            <p className='text-sm sm:text-base text-emerald-50 mb-4 text-center md:text-left'>
              คุณสามารถตรวจสอบว่าคุณได้รับรางวัลจากการจับสลากหรือไม่<br className="hidden sm:block" />
              โดยสามารถค้นหาด้วยชื่อเพื่อดูรางวัลที่คุณได้รับและรายละเอียดการจับสลาก
            </p>
            <form
              onSubmit={handleCheckWinner}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 w-full"
            >
              <input
                type="text"
                name="winner_name"
                placeholder="กรุณาใส่ชื่อเพื่อตรวจสอบรางวัล..."
                className="flex-1 w-full sm:w-auto px-4 py-2 sm:rounded-l-full rounded-full sm:rounded-r-none bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm sm:text-base"
                required
                disabled={checkingWinner}
              />
              <button
                type="submit"
                disabled={checkingWinner}
                className="px-4 py-2 sm:rounded-r-full rounded-full sm:rounded-l-none bg-emerald-600 text-emerald-100 font-semibold hover:bg-emerald-500 transition-colors text-base sm:text-lg w-full sm:w-auto sm:min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingWinner ? 'กำลังตรวจสอบ...' : 'ตรวจสอบรางวัล'}
              </button>
            </form>
            <Link 
              href="/raffle/winners?raffle_event=1"
              className='mt-4 text-emerald-50 hover:text-white underline underline-offset-1 transition-colors text-center md:text-left block'
            >
              ดูรายชื่อผู้ได้รับรางวัลทั้งหมด
            </Link>
          </div>
        </div>
        
        <div className="flex justify-center items-center gap-6 mt-16 mb-6">
          <img
            src="/images/Logonrh.png"
            alt="NR Sport Logo"
            className="h-24 md:h-32 w-auto drop-shadow"
          />
          <img
            src="/images/logo MOPH.png"
            alt="Ministry of Public Health Logo"
            className="h-20 md:h-32 w-auto drop-shadow"
          />
        </div>
      </main>

      {/* Modal สำหรับแสดงผลการตรวจสอบ */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={searchQuery ? `ผลการค้นหา: "${searchQuery}"` : 'ผลการตรวจสอบ'}
      >
        {checking ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-600">กำลังค้นหา...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="py-2">
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">
                  พบรายชื่อ {searchResults.length} รายการ
                </p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      ลำดับ
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      แผนก
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((participant, index) => (
                    <tr
                      key={participant.id}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                        {participant.hospital_id || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                        {participant.department_name || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          มีสิทธิ์์
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-700 mb-2">
              ไม่พบรายชื่อ
            </h3>
            <p className="text-lg text-gray-600 mb-1">
              ชื่อที่ค้นหา: <span className="font-semibold text-gray-700">{searchQuery}</span>
            </p>
            <p className="text-base text-gray-500">
              ไม่พบรายชื่อที่ตรงกับการค้นหา หรือไม่มีสิทธิ์์เข้าร่วมการจับสลาก
            </p>
            <p className="text-sm text-gray-400 mt-2">
              กรุณาตรวจสอบชื่ออีกครั้ง หรือลองค้นหาแบบละเอียดที่{' '}
              <Link href="/raffle/participants" className="text-emerald-600 hover:underline">
                หน้านี้
              </Link>
            </p>
          </div>
        )}
      </Modal>

      {/* Modal สำหรับแสดงผลการตรวจสอบผู้ได้รับรางวัล */}
      <Modal
        isOpen={isWinnerModalOpen}
        onClose={closeWinnerModal}
        title=""
      >
        {winnerModalType === 'success' && winnerInfo ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-yellow-100 p-4">
                <Trophy className="h-16 w-16 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-emerald-700 mb-2">
              ยินดีด้วย! คุณได้รับรางวัล
            </h3>
            <p className="text-lg text-gray-600 mb-1">
              ชื่อ: <span className="font-semibold text-emerald-700">{winnerInfo.participant_name}</span>
            </p>
            <div className="bg-emerald-50 rounded-lg p-4 mt-4 mb-2">
              <p className="text-base text-gray-700 mb-1">
                <span className="font-semibold">รางวัล:</span> {winnerInfo.prize_name}
              </p>
              {winnerInfo.participant_department && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">แผนก:</span> {winnerInfo.participant_department}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              ขอแสดงความยินดีกับคุณที่ได้รับรางวัลจากการจับสลากปีใหม่ 2569
            </p>
          </div>
        ) : winnerModalType === 'not-found' ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gray-100 p-4">
                <Trophy className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              ยังไม่ได้รับรางวัล
            </h3>
            <p className="text-lg text-gray-600 mb-1">
              ชื่อที่ค้นหา: <span className="font-semibold text-gray-700">{winnerName}</span>
            </p>
            <p className="text-base text-gray-500">
              ยังไม่พบรายชื่อของคุณในรายชื่อผู้ได้รับรางวัล
            </p>
            <p className="text-sm text-gray-400 mt-2">
              การจับสลากอาจยังไม่เสร็จสิ้น หรือคุณอาจจะยังไม่ได้รับรางวัลในรอบนี้
            </p>
          </div>
        ) : null}
      </Modal>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
