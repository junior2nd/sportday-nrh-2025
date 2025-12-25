'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { raffleApi, Prize } from '@/lib/api/raffle';
import { Lock } from 'lucide-react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

const MOBILE_CONTROLLER_PASSWORD = '10897';
const DISPLAY_COUNTS = [1, 2, 3, 6, 10, 20, 30];

export default function MobileControllerPage() {
  const searchParams = useSearchParams();
  const [raffleEventId, setRaffleEventId] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSpun, setHasSpun] = useState(false); // เพิ่ม state สำหรับติดตามว่าได้กด spin แล้วหรือยัง
  const [remoteIsSpinning, setRemoteIsSpinning] = useState(false); // Track remote spinning state from WebSocket

  // Load password from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPassword = localStorage.getItem('mobile_controller_password');
      if (savedPassword) {
        setPassword(savedPassword);
        // Auto-login if password is saved
        if (savedPassword === MOBILE_CONTROLLER_PASSWORD) {
          setIsAuthenticated(true);
        }
      }
    }
  }, []);

  // Extract raffle_event from URL
  useEffect(() => {
    const raffleEventParam = searchParams.get('raffle_event');
    if (raffleEventParam) {
      const eventId = parseInt(raffleEventParam, 10);
      if (!isNaN(eventId)) {
        setRaffleEventId(eventId);
      }
    }
  }, [searchParams]);

  // Load prizes when authenticated and raffleEventId is available
  useEffect(() => {
    if (isAuthenticated && raffleEventId) {
      loadPrizes();
    }
  }, [isAuthenticated, raffleEventId]);

  // WebSocket connection for receiving spin state
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const wsUrl = raffleEventId && isAuthenticated
    ? `${API_URL.replace('/api', '')}/ws/raffle/${raffleEventId}/`
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

  const loadPrizes = async () => {
    if (!raffleEventId) return;
    
    try {
      setLoading(true);
      const data = await raffleApi.listPrizesPublic(raffleEventId);
      setPrizes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading prizes:', err);
      setError('ไม่สามารถโหลดข้อมูลรางวัลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === MOBILE_CONTROLLER_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      // Save password to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mobile_controller_password', password);
      }
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleSpin = async () => {
    if (!raffleEventId || !selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await raffleApi.controlSpin({
        raffle_event_id: raffleEventId,
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
    if (!raffleEventId) {
      setError('ไม่พบข้อมูลการจับสลาก');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await raffleApi.controlSave({
        raffle_event_id: raffleEventId,
      });
      setHasSpun(false); // Reset flag หลังจากบันทึกสำเร็จ
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งคำสั่ง Save');
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeSelect = (prize: Prize) => {
    if (hasSpun) return; // ถ้ากด spin แล้ว ไม่อนุญาตให้เปลี่ยนรางวัล
    
    setSelectedPrize(prize);
    // Send select prize command
    if (raffleEventId) {
      raffleApi.controlSelectPrize({
        raffle_event_id: raffleEventId,
        prize_id: prize.id,
      }).catch(err => console.error('Error selecting prize:', err));
    }
  };

  const handleDisplayCountChange = (count: number) => {
    if (hasSpun) return; // ถ้ากด spin แล้ว ไม่อนุญาตให้เปลี่ยนจำนวนจอ
    
    setDisplayCount(count);
    // Send set display count command
    if (raffleEventId) {
      raffleApi.controlSetDisplayCount({
        raffle_event_id: raffleEventId,
        display_count: count,
      }).catch(err => console.error('Error setting display count:', err));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Mobile Controller</h1>
            <p className="text-gray-600 mt-2">กรุณากรอกรหัสผ่านเพื่อเข้าถึง</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรุณากรอกรหัสผ่าน"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleLogin}
              onTouchStart={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-semibold shadow-lg touch-manipulation"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availablePrizes = prizes.filter(p => p.selected_count < p.quantity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-bold mb-2">Remote Controller</h1>
          <p className="text-gray-300">ควบคุมการแสดงผลการจับสลาก</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Prize Selection - Button Grid */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-white text-lg font-semibold mb-4 text-center">เลือกรางวัล</h2>
          {loading && prizes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : availablePrizes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {availablePrizes.map((prize) => {
                const isSelected = selectedPrize?.id === prize.id;
                const remaining = prize.quantity - prize.selected_count;
                return (
                  <button
                    key={prize.id}
                    onClick={() => handlePrizeSelect(prize)}
                    disabled={hasSpun || loading || remoteIsSpinning}
                    className={`
                      px-4 py-4 rounded-xl font-semibold text-sm transition-all duration-200
                      ${isSelected 
                        ? 'bg-amber-500 text-white shadow-lg scale-105 border-2 border-amber-300' 
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-2 border-gray-600'
                      }
                      ${hasSpun || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="text-center">
                      <div className="font-bold text-base">{prize.name}</div>
                      <div className="text-xs mt-1 opacity-90">เหลือ {remaining}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>ไม่มีรางวัลที่พร้อมจับสลาก</p>
            </div>
          )}
        </div>

        {/* Display Count - Button Grid */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-white text-lg font-semibold mb-4 text-center">จำนวนจอ</h2>
          <div className="grid grid-cols-5 gap-2">
            {DISPLAY_COUNTS.map((count) => {
              const isSelected = displayCount === count;
              return (
                <button
                  key={count}
                  onClick={() => handleDisplayCountChange(count)}
                  onTouchStart={() => handleDisplayCountChange(count)}
                  disabled={hasSpun || !selectedPrize || loading || remoteIsSpinning}
                  className={`
                    px-4 py-4 rounded-xl font-bold text-lg transition-all duration-200 touch-manipulation
                    ${isSelected 
                      ? 'bg-blue-500 text-white shadow-lg scale-105 border-2 border-blue-300' 
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500 border-2 border-gray-600'
                    }
                    ${hasSpun || !selectedPrize || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-4">
          {/* Spin Button */}
          <button
            onClick={handleSpin}
            onTouchStart={(e) => {
              if (!loading && selectedPrize && !hasSpun && !remoteIsSpinning) {
                e.preventDefault();
                handleSpin();
              }
            }}
            disabled={loading || !selectedPrize || hasSpun || remoteIsSpinning}
            className={`
              w-full px-8 py-8 rounded-2xl font-bold text-3xl shadow-2xl
              transition-all duration-200 transform touch-manipulation
              ${hasSpun || !selectedPrize || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 active:scale-95 active:from-amber-700 active:to-orange-800'
              }
            `}
          >
            {loading ? 'กำลังส่งคำสั่ง...' : hasSpun ? 'ได้กด SPIN แล้ว' : 'SPIN'}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            onTouchStart={(e) => {
              if (!loading && hasSpun && !remoteIsSpinning) {
                e.preventDefault();
                handleSave();
              }
            }}
            disabled={loading || !hasSpun || remoteIsSpinning}
            className={`
              w-full px-8 py-6 rounded-2xl font-bold text-2xl shadow-2xl
              transition-all duration-200 transform touch-manipulation
              ${!hasSpun || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 active:scale-95 active:from-green-700 active:to-emerald-800'
              }
            `}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
