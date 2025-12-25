'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParticipants } from '@/lib/hooks/data/useParticipants';
import { extractResults } from '@/lib/utils/api';
import { Participant } from '@/lib/api/teams';

interface SlotMachineCardProps {
  finalValue: string;
  isSpinning?: boolean;
  spinDuration?: number; // in milliseconds
  eventId?: number; // Event ID to fetch participants (optional)
  spinningNames?: string[]; // Optional: provide names directly
  className?: string;
  textSize?: string; // Text size class (e.g., 'text-sm', 'text-lg', 'text-xl')
  cardPadding?: string; // Padding class (e.g., 'p-2', 'p-4', 'p-6')
}

// Default fallback names
const defaultNames = [
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

export default function SlotMachineCard({
  finalValue,
  isSpinning = false,
  spinDuration = 2000,
  eventId,
  spinningNames = [],
  className = '',
  textSize = 'text-xl md:text-2xl', // Default text size
  cardPadding = 'p-4' // Default padding
}: SlotMachineCardProps) {
  const [displayValue, setDisplayValue] = useState<string | null>(null); // null = แสดงรูปภาพ
  const [isAnimating, setIsAnimating] = useState(false);

  // ดึงรายชื่อ participants จาก API ถ้ามี eventId และไม่มี spinningNames
  const shouldFetchNames = !spinningNames.length && !!eventId;
  const { data: participantsResponse } = useParticipants(
    shouldFetchNames ? {
      event: eventId,
      page_size: 1000,
    } : undefined
  );

  // สร้างรายชื่อจาก participants หรือใช้ fallback (กรองเฉพาะผู้ที่มีสิทธิ์)
  const randomNames = useMemo(() => {
    if (spinningNames.length > 0) {
      return spinningNames;
    }
    if (participantsResponse && shouldFetchNames) {
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
    return defaultNames;
  }, [spinningNames, participantsResponse, shouldFetchNames]);

  // อัพเดต displayValue เมื่อ finalValue เปลี่ยน (เฉพาะเมื่อไม่ได้ spinning)
  useEffect(() => {
    if (!isSpinning && !isAnimating) {
      // ถ้าไม่ได้ spinning และไม่ได้ animating ให้แสดง finalValue
      // แต่ถ้า finalValue ยังไม่มี ให้แสดง null (จะแสดงรูปภาพ)
      setDisplayValue(finalValue || null);
    }
  }, [finalValue, isSpinning, isAnimating]);

  // Animation logic - แบบง่ายๆ ใช้ setInterval
  useEffect(() => {
    if (isSpinning && randomNames.length > 0) {
      // เริ่มต้นด้วยชื่อ random ทันทีเมื่อเริ่ม spinning
      const randomIndex = Math.floor(Math.random() * randomNames.length);
      setDisplayValue(randomNames[randomIndex]);
      setIsAnimating(true);
      
      const interval = setInterval(() => {
        // Random name from the list
        const randomIndex = Math.floor(Math.random() * randomNames.length);
        setDisplayValue(randomNames[randomIndex]);
      }, 100); // Change every 100ms for smooth animation

      // Stop spinning after duration
      // แสดง logo ก่อน แล้วค่อยแสดงผลลัพธ์
      const logoDisplayTime = 500; // แสดง logo 500ms
      const timeout = setTimeout(() => {
        clearInterval(interval);
        // แสดง logo ก่อน
        setDisplayValue(null);
        setIsAnimating(false);
        
        // หลังจากแสดง logo แล้ว ค่อยแสดงผลลัพธ์
        setTimeout(() => {
          setDisplayValue(finalValue);
        }, logoDisplayTime);
      }, spinDuration);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        setIsAnimating(false);
      };
    } else {
      setIsAnimating(false);
      // ถ้าไม่ได้ spinning และไม่มี finalValue ให้แสดง null (จะแสดงรูปภาพ)
      if (!finalValue) {
        setDisplayValue(null);
      }
    }
  }, [isSpinning, spinDuration, randomNames, finalValue]);

  return (
    <div className={`relative w-full h-full rounded-xl border-2 border-emerald-500/50 overflow-hidden ${className}`} style={{ perspective: '1000px' }}>
      {/* 3D Container with CSS animation */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: isAnimating ? 'rotateX(1080deg)' : 'rotateX(0deg)',
          transformOrigin: 'center center',
          transition: isAnimating ? `transform ${spinDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` : 'none',
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-400 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0px)',
          }}
        >
          {displayValue === null ? (
            // แสดงรูปภาพเมื่อ displayValue เป็น null
            <img
              src="/images/Logonrh.png"
              alt="Logo"
              className="w-3/4 h-3/4 object-contain opacity-90"
            />
          ) : (
            <div className={`${textSize} font-bold text-white text-center ${cardPadding}`}>
              {displayValue}
            </div>
          )}
        </div>
        
        {/* Back Face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-yellow-700 via-yellow-500 to-yellow-600 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateX(180deg) translateZ(0px)',
          }}
        >
          {displayValue === null ? (
            // แสดงรูปภาพเมื่อ displayValue เป็น null
            <img
              src="/images/Logonrh.png"
              alt="Logo"
              className="w-3/4 h-3/4 object-contain opacity-90"
              style={{
                transform: 'rotateX(180deg)',
              }}
            />
          ) : (
            <div 
              className={`${textSize} font-bold text-white text-center ${cardPadding}`}
              style={{
                transform: 'rotateX(180deg)',
              }}
            >
              {displayValue}
            </div>
          )}
        </div>
      </div>
      
      {/* Shine effect while spinning */}
      {isAnimating && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none rounded-xl"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
            animation: 'shine 1s linear infinite',
          }}
        />
      )}
      
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
  );
}
