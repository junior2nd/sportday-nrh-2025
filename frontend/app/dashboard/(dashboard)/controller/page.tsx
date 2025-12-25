'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { raffleApi, Prize, RaffleEvent } from '@/lib/api/raffle';
import { useHeader } from '@/components/ui/HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { QrCode, Play, Pause } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

export default function ControllerPage() {
  const pathname = usePathname();
  const { setHeader } = useHeader();
  const { selectedEvent } = useEvent();
  const [raffleEvents, setRaffleEvents] = useState<RaffleEvent[]>([]);
  const [selectedRaffleEvent, setSelectedRaffleEvent] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [hasSpun, setHasSpun] = useState(false); // เพิ่ม state สำหรับติดตามว่าได้กด spin แล้วหรือยัง
  const [remoteIsSpinning, setRemoteIsSpinning] = useState(false); // Track remote spinning state from WebSocket
  const [playingSound, setPlayingSound] = useState<string | null>(null); // Track which sound is currently playing
  const lastPathnameRef = useRef<string | null>(null);
  
  // Audio refs for background sounds
  const wheelSoundRef = useRef<HTMLAudioElement | null>(null);
  const oscaSoundRef = useRef<HTMLAudioElement | null>(null);
  const marvelSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setHeader(
      'Controller',
      'ควบคุมการแสดงผลการจับสลาก'
    );
  }, [pathname, setHeader]);

  // Initialize audio objects
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      // Initialize wheel sound
      try {
        wheelSoundRef.current = new Audio('/audio/wheel.mp3');
        wheelSoundRef.current.preload = 'auto';
        wheelSoundRef.current.loop = false; // Prevent looping
      } catch (err) {
        console.error('Error initializing wheel sound:', err);
      }

      // Initialize osca sound (if file exists)
      try {
        oscaSoundRef.current = new Audio('/audio/osca.mp3');
        oscaSoundRef.current.preload = 'auto';
        oscaSoundRef.current.loop = false; // Prevent looping
        oscaSoundRef.current.addEventListener('error', () => {
          console.warn('osca.mp3 file not found or failed to load');
        });
      } catch (err) {
        console.error('Error initializing osca sound:', err);
      }

      // Initialize marvel sound (if file exists)
      try {
        marvelSoundRef.current = new Audio('/audio/marvel.mp3');
        marvelSoundRef.current.preload = 'auto';
        marvelSoundRef.current.loop = false; // Prevent looping
        marvelSoundRef.current.addEventListener('error', () => {
          console.warn('marvel.mp3 file not found or failed to load');
        });
      } catch (err) {
        console.error('Error initializing marvel sound:', err);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (wheelSoundRef.current) {
        wheelSoundRef.current.pause();
        wheelSoundRef.current.currentTime = 0;
        wheelSoundRef.current = null;
      }
      if (oscaSoundRef.current) {
        oscaSoundRef.current.pause();
        oscaSoundRef.current.currentTime = 0;
        oscaSoundRef.current = null;
      }
      if (marvelSoundRef.current) {
        marvelSoundRef.current.pause();
        marvelSoundRef.current.currentTime = 0;
        marvelSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    loadRaffleEvents();
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedRaffleEvent) {
      loadPrizes();
      loadQRCode();
    }
  }, [selectedRaffleEvent]);

  // WebSocket connection for receiving spin state
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const wsUrl = selectedRaffleEvent
    ? `${API_URL.replace('/api', '')}/ws/raffle/${selectedRaffleEvent}/`
    : '';

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      if (message.type === 'control_action') {
        const { action, data } = message;
        if (action === 'spin_state') {
          if (data.isSpinning !== undefined) {
            setRemoteIsSpinning(data.isSpinning);
            // If remote spinning stops and we have spun, reset hasSpun
            if (!data.isSpinning && hasSpun) {
              setHasSpun(false);
            }
          }
        }
      }
    },
  });

  const loadRaffleEvents = async () => {
    try {
      const data = await raffleApi.listEvents(selectedEvent ? { event: selectedEvent } : undefined);
      const raffleArray = Array.isArray(data) ? data : [];
      setRaffleEvents(raffleArray);
      if (raffleArray.length > 0 && !selectedRaffleEvent) {
        setSelectedRaffleEvent(raffleArray[0].id);
      }
    } catch (err) {
      console.error('Error loading raffle events:', err);
      setRaffleEvents([]);
    }
  };

  const loadPrizes = async () => {
    if (!selectedRaffleEvent) return;

    try {
      setLoading(true);
      setError('');
      const data = await raffleApi.listPrizes({ raffle_event: selectedRaffleEvent });
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลรางวัลได้');
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQRCode = async () => {
    if (!selectedRaffleEvent) return;

    try {
      // สร้าง URL ของ mobile controller จาก frontend URL แทนที่จะใช้ backend URL
      const frontendUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const mobileControllerUrl = `${frontendUrl}/raffle/mobile-controller?raffle_event=${selectedRaffleEvent}`;
      setQrCodeUrl(mobileControllerUrl);
    } catch (err) {
      console.error('Error loading QR code:', err);
    }
  };

  const handleSpin = async () => {
    if (!selectedRaffleEvent || !selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await raffleApi.controlSpin({
        raffle_event_id: selectedRaffleEvent,
        prize_id: selectedPrize.id,
        display_count: displayCount,
      });
      setHasSpun(true); // ตั้งค่า flag ว่าได้กด spin แล้ว
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำสั่ง Spin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRaffleEvent) {
      setError('กรุณาเลือกการจับสลากก่อน');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await raffleApi.controlSave({
        raffle_event_id: selectedRaffleEvent,
      });
      setHasSpun(false); // Reset flag หลังจากบันทึกสำเร็จ
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำสั่ง Save');
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeChange = (prizeId: string) => {
    if (hasSpun) return; // ถ้ากด spin แล้ว ไม่อนุญาตให้เปลี่ยนรางวัล
    
    if (!prizeId) {
      setSelectedPrize(null);
      return;
    }
    
    const prize = prizes.find(p => p.id === parseInt(prizeId, 10));
    if (prize) {
      setSelectedPrize(prize);
      // Send select prize command
      if (selectedRaffleEvent) {
        raffleApi.controlSelectPrize({
          raffle_event_id: selectedRaffleEvent,
          prize_id: prize.id,
        }).catch(err => console.error('Error selecting prize:', err));
      }
    }
  };

  const handleDisplayCountChange = (value: string) => {
    if (hasSpun) return; // ถ้ากด spin แล้ว ไม่อนุญาตให้เปลี่ยนจำนวนจอ
    
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0 && count <= 30) {
      setDisplayCount(count);
      // Send set display count command
      if (selectedRaffleEvent) {
        raffleApi.controlSetDisplayCount({
          raffle_event_id: selectedRaffleEvent,
          display_count: count,
        }).catch(err => console.error('Error setting display count:', err));
      }
    }
  };

  const handleSoundToggle = (soundName: 'wheel' | 'osca' | 'marvel') => {
    // Stop all sounds first and remove event listeners
    if (wheelSoundRef.current) {
      wheelSoundRef.current.pause();
      wheelSoundRef.current.currentTime = 0;
      wheelSoundRef.current.onended = null;
    }
    if (oscaSoundRef.current) {
      oscaSoundRef.current.pause();
      oscaSoundRef.current.currentTime = 0;
      oscaSoundRef.current.onended = null;
    }
    if (marvelSoundRef.current) {
      marvelSoundRef.current.pause();
      marvelSoundRef.current.currentTime = 0;
      marvelSoundRef.current.onended = null;
    }

    // If the same sound is playing, stop it
    if (playingSound === soundName) {
      setPlayingSound(null);
      return;
    }

    // Play the selected sound
    let soundRef: HTMLAudioElement | null = null;
    switch (soundName) {
      case 'wheel':
        soundRef = wheelSoundRef.current;
        break;
      case 'osca':
        soundRef = oscaSoundRef.current;
        break;
      case 'marvel':
        soundRef = marvelSoundRef.current;
        break;
    }

    if (soundRef) {
      // Ensure loop is disabled
      soundRef.loop = false;
      soundRef.currentTime = 0;
      
      // Set up ended event handler before playing
      soundRef.onended = () => {
        setPlayingSound(null);
        soundRef.onended = null;
      };

      soundRef.play().catch((err: any) => {
        console.error(`Error playing ${soundName} sound:`, err);
        setPlayingSound(null);
      });
      
      setPlayingSound(soundName);
    } else {
      console.warn(`Sound file for ${soundName} is not available`);
      setPlayingSound(null);
    }
  };

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กรุณาเลือกกิจกรรมจากหน้า Event Selection</p>
      </div>
    );
  }

  const availablePrizes = prizes.filter(p => p.selected_count < p.quantity);

  // Calculate total prizes stats
  const totalQuantity = prizes.reduce((sum, prize) => sum + prize.quantity, 0);
  const totalSelected = prizes.reduce((sum, prize) => sum + (prize.selected_count || 0), 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Raffle Event Selector */}
      {/* <div className="bg-white rounded-lg shadow p-4">
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
              {raffle.name} ({raffle.event_name})
            </option>
          ))}
        </select>
      </div> */}

      {selectedRaffleEvent && (
        <>
          {/* Prize Status Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className='flex items-center justify-between mb-4'>
              <h3 className="text-lg font-semibold text-gray-900">สถานะรางวัล</h3>
              <div className="text-lg font-semibold text-gray-900">
                {totalSelected} / {totalQuantity}
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : prizes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
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
                <p>ยังไม่มีรางวัลสำหรับการจับสลากนี้</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">ควบคุมการแสดงผล</h2>

              {/* Prize Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกประเภทรางวัล
                </label>
                <select
                  value={selectedPrize?.id.toString() || ''}
                  onChange={(e) => handlePrizeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || availablePrizes.length === 0 || remoteIsSpinning}
                >
                  <option value="">-- เลือกประเภทรางวัล --</option>
                  {availablePrizes.map((prize) => (
                    <option key={prize.id} value={prize.id.toString()}>
                      {prize.name} (เหลือ {prize.quantity - prize.selected_count} รางวัล)
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนจอ
                </label>
                <select
                  value={displayCount}
                  onChange={(e) => handleDisplayCountChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedPrize || remoteIsSpinning}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSpin}
                  disabled={!selectedPrize || loading || hasSpun || remoteIsSpinning}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'กำลังส่งคำสั่ง...' : hasSpun ? 'ได้กด Spin แล้ว' : 'Spin'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !hasSpun || remoteIsSpinning}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>

            {/* QR Code Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mobile Controller</h2>
              {qrCodeUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <QRCodeSVG
                          value={qrCodeUrl}
                          size={128}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Scan QR Code เพื่อเข้าถึง Mobile Controller</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <a
                      href={qrCodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      เปิด Mobile Controller
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>กรุณาเลือกการจับสลาก</p>
                </div>
              )}
            </div>

            {/* Background Sounds Section */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">เสียงบรรยากาศ</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleSoundToggle('wheel')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    playingSound === 'wheel'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {playingSound === 'wheel' ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Wheel</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Wheel</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSoundToggle('osca')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    playingSound === 'osca'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {playingSound === 'osca' ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Osca</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Osca</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSoundToggle('marvel')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    playingSound === 'marvel'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {playingSound === 'marvel' ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Marvel</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Marvel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

