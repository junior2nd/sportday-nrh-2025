'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParticipants } from '@/lib/hooks/data/useParticipants';
import { extractResults } from '@/lib/utils/api';
import { Participant } from '@/lib/api/teams';

// รายชื่อ fallback สำหรับกรณีที่ยังไม่ได้ดึงข้อมูล
const fallbackNames = [
  'นายทดสอบ ระบบ',
  'นางสาวตัวอย่าง',
  'นายสมชาย ใจดี',
  'นางสมหญิง รักงาน',
  'นายประเสริฐ มาก',
  'นางสาวสวยงาม',
  'นายเก่งมาก',
  'นางสาวดีใจ',
  'นายสุขใจ',
  'นางสาวร่าเริง',
  'นายวิศวะ แข็งแรง',
  'นางสาวแพทย์ สุขภาพดี',
  'นายพยาบาล ขยัน',
  'นางสาวครู อบอุ่น',
  'นายนักบัญชี ระมัดระวัง',
  'นางสาวนักพัฒนา สร้างสรรค์',
  'นายนักออกแบบ สวยงาม',
  'นางสาวนักวิจัย ขยัน',
  'นายผู้บริหาร เก่งกาจ',
  'นางสาวผู้จัดการ มีวินัย'
];

/**
 * Test page for slot machine animation
 * Use this page to test and develop the animation before integrating into SpinningCard component
 */
export default function AnimationTestPage() {
  const searchParams = useSearchParams();
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalValue, setFinalValue] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('');
  const [rotationX, setRotationX] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const isCancelledRef = useRef(false);

  // ดึง event ID จาก URL (optional)
  const eventIdParam = searchParams.get('event');
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  // ดึงรายชื่อ participants จาก API
  const { data: participantsResponse, isLoading: isLoadingParticipants } = useParticipants({
    event: eventId,
    page_size: 1000, // ดึงมากๆ เพื่อให้ได้รายชื่อครบ
  });

  // สร้างรายชื่อจาก participants หรือใช้ fallback (กรองเฉพาะผู้ที่มีสิทธิ์)
  const randomNames = useMemo(() => {
    if (participantsResponse) {
      const participants = extractResults<Participant>(participantsResponse);
      if (participants.length > 0) {
        // กรองเฉพาะผู้ที่มีสิทธิ์จับรางวัล (is_raffle_eligible = true) และชื่อไม่ว่าง
        const eligibleNames = participants
          .filter((p: Participant) => p.is_raffle_eligible !== false && p.name && p.name.trim() !== '')
          .map((p: Participant) => p.name);
        if (eligibleNames.length > 0) {
          return eligibleNames;
        }
      }
    }
    return fallbackNames;
  }, [participantsResponse]);

  // อัพเดต displayValue เมื่อ randomNames เปลี่ยน - สุ่มรายชื่อเริ่มต้น
  useEffect(() => {
    if (randomNames.length > 0 && !finalValue && !isSpinning) {
      // สุ่มรายชื่อเริ่มต้น
      const randomIndex = Math.floor(Math.random() * randomNames.length);
      setDisplayValue(randomNames[randomIndex]);
    }
  }, [randomNames, finalValue, isSpinning]);

  useEffect(() => {
    if (!isSpinning) {
      // ไม่ได้ spinning - reset ทุกอย่าง
      if (finalValue) {
        setDisplayValue(finalValue);
      } else if (randomNames.length > 0) {
        // สุ่มรายชื่อเมื่อไม่ได้ spinning และไม่มี finalValue
        const randomIndex = Math.floor(Math.random() * randomNames.length);
        setDisplayValue(randomNames[randomIndex]);
      }
      setRotationX(0);
      setProgress(0);
      return;
    }

    // Cleanup function ก่อนเริ่ม animation ใหม่
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startTime = Date.now();
    const spinDuration = 2000; // 15 seconds
    let lastNameChangeTime = startTime;
    isCancelledRef.current = false;
    
    const animate = () => {
      // ตรวจสอบว่า animation ยัง active อยู่หรือไม่
      if (isCancelledRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / spinDuration, 1);
      
      setProgress(currentProgress);
      
      // Easing function - ช้าลงมากเมื่อใกล้จบ (ease-out quintic)
      const easeOut = 1 - Math.pow(1 - currentProgress, 5);
      
      // Rotate 3 รอบ
      const totalRotations = 3;
      const currentRotation = easeOut * totalRotations * 360;
      setRotationX(currentRotation);
      
      // เปลี่ยนชื่อ - ช้าลงเรื่อยๆ และมี pause
      if (currentProgress < 0.92) {
        const baseInterval = 200;
        const maxInterval = 800;
        const nameChangeInterval = baseInterval + (currentProgress * (maxInterval - baseInterval));
        
        const timeSinceLastNameChange = Date.now() - lastNameChangeTime;
        
        if (timeSinceLastNameChange >= nameChangeInterval) {
          const randomIndex = Math.floor(Math.random() * randomNames.length);
          setDisplayValue(randomNames[randomIndex]);
          lastNameChangeTime = Date.now();
          
          // หยุดชั่วคราวบางครั้ง
          if (currentProgress > 0.3 && currentProgress < 0.75 && Math.random() < 0.15) {
            lastNameChangeTime += 500;
          }
        }
      } else {
        setDisplayValue(finalValue);
      }
      
      // Continue หรือหยุด
      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // เสร็จแล้ว
        setProgress(1);
        setRotationX(0);
        setDisplayValue(finalValue);
        setIsSpinning(false);
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      isCancelledRef.current = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSpinning, finalValue, randomNames]);

  const handleSpin = () => {
    // สุ่ม final value จากรายชื่อที่มี
    if (randomNames.length > 0) {
      const randomIndex = Math.floor(Math.random() * randomNames.length);
      const selectedFinalValue = randomNames[randomIndex];
      setFinalValue(selectedFinalValue);
      setDisplayValue(selectedFinalValue); // ตั้งค่าเริ่มต้น
    }
    setIsSpinning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Animation Test Page</h1>
        
        {/* Controls */}
        <div className="bg-white/10 rounded-lg p-6 mb-8 space-y-4">
          <button
            onClick={handleSpin}
            disabled={isSpinning || randomNames.length === 0 || isLoadingParticipants}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {isLoadingParticipants 
              ? 'Loading participants...' 
              : isSpinning 
              ? 'Spinning...' 
              : 'Start Spin (สุ่มรายชื่ออัตโนมัติ)'}
          </button>
          {randomNames.length === 0 && !isLoadingParticipants && (
            <p className="text-yellow-400 text-sm text-center">
              ไม่พบรายชื่อ กรุณาเพิ่ม ?event=1 ใน URL หรือรอให้ระบบโหลดข้อมูล
            </p>
          )}
        </div>

        {/* Test Area - Add your animation code here */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white/5 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Animation Test Area</p>
              <p className="text-sm text-gray-500">
                Add your slot machine animation code here
              </p>
              
              {/* Debug Info */}
              <div className="mb-4 text-xs text-gray-400 space-y-1 bg-black/30 p-3 rounded">
                <div>Status: {isSpinning ? 'Spinning...' : 'Stopped'}</div>
                <div>Progress: {(progress * 100).toFixed(1)}%</div>
                <div>Rotation: {rotationX.toFixed(1)}°</div>
                <div>Current Name: {displayValue || '(ไม่มี)'}</div>
                {finalValue && <div className="text-green-400 font-semibold">Final Value (ผลลัพธ์): {finalValue}</div>}
                <div>Total Names: {randomNames.length} {isLoadingParticipants ? '(Loading...)' : ''}</div>
                {eventId && <div>Event ID: {eventId}</div>}
                {isSpinning && (
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              {/* Slot Machine Animation */}
              <div className="mt-8 w-full max-w-md mx-auto">
                <div
                  className="relative aspect-[4/3] rounded-xl border-2 border-emerald-500/50 overflow-hidden"
                  style={{
                    perspective: '1000px',
                  }}
                >
                  {/* 3D Container */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${rotationX}deg)`,
                      transformOrigin: 'center center',
                      willChange: 'transform',
                    }}
                  >
                    {/* Front Face */}
                    <div
                      className="absolute inset-0 bg-linear-to-br from-emerald-900 via-emerald-700 to-emerald-400 flex items-center justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0px)',
                      }}
                    >
                      <div className="text-2xl md:text-3xl font-bold text-white text-center p-8">
                        {displayValue}
                      </div>
                    </div>
                    
                    {/* Back Face */}
                    <div
                      className="absolute inset-0 bg-linear-to-br from-yellow-700 via-yellow-500 to-yellow-600 flex items-center justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateX(180deg) translateZ(0px)',
                      }}
                    >
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white text-center p-8"
                        style={{
                          transform: 'rotateX(180deg)',
                        }}
                      >
                        {displayValue}
                      </div>
                    </div>
                  </div>
                  
                  {/* Shine effect while spinning */}
                  {isSpinning && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none rounded-xl"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                        animation: 'shine 1s linear infinite',
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* CSS Animation */}
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes shine {
                    0% {
                      transform: translateX(-100%);
                    }
                    100% {
                      transform: translateX(100%);
                    }
                  }
                `
              }} />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Animation ใช้ rotateX สำหรับการหมุนลง (vertical rotation)</li>
            <li>• รายชื่อจะถูกดึงจากระบบอัตโนมัติ (สุ่มจาก participants ทั้งหมด)</li>
            <li>• เพิ่ม <code className="bg-black/50 px-1 rounded">?event=1</code> ใน URL เพื่อกรองรายชื่อตาม event (optional)</li>
            <li>• ใช้ easing function (ease-out quintic) สำหรับการชะลอตัว</li>
            <li>• หมุน 3 รอบ (1080 degrees) ใน 10 วินาที แล้วชะลอลง</li>
            <li>• มีการหยุดชั่วคราวแบบสุ่ม 15% ของเวลา</li>
            <li>• เมื่อเสร็จแล้ว คัดลอก code ไปใส่ใน SpinningCard.tsx</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

