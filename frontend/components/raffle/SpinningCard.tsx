'use client';

import { useState, useEffect } from 'react';
import ParticipantsCard from '@/components/participants/ParticipantsCard';

interface SpinningCardProps {
  finalValue: string;
  spinningNames?: string[];
  isSpinning?: boolean;
  spinDuration?: number; // in milliseconds
  className?: string;
  textSize?: string; // e.g., 'text-5xl/16', 'text-3xl/16', 'text-2xl/16'
}

export default function SpinningCard({ 
  finalValue, 
  spinningNames = [], 
  isSpinning = false,
  spinDuration = 2000,
  className,
  textSize = 'text-5xl/16'
}: SpinningCardProps) {
  const [displayValue, setDisplayValue] = useState(finalValue);
  const [isAnimating, setIsAnimating] = useState(false);

  // Default spinning names if not provided
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
    'นางสาวร่าเริง'
  ];

  const names = spinningNames.length > 0 ? spinningNames : defaultNames;

  useEffect(() => {
    if (isSpinning) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        // Random name from the list
        const randomIndex = Math.floor(Math.random() * names.length);
        setDisplayValue(names[randomIndex]);
      }, 50); // Change every 50ms for smooth animation

      // Stop spinning after duration
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(finalValue);
        setIsAnimating(false);
      }, spinDuration);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(finalValue);
      setIsAnimating(false);
    }
  }, [isSpinning, finalValue, spinDuration, names]);

  return (
    <div className={`grid ${className || ''}`}>
      <ParticipantsCard 
        value={displayValue} 
        className={isAnimating ? 'animate-pulse' : ''}
        textSize={textSize}
        isSpinning={isAnimating}
      />
    </div>
  );
}

