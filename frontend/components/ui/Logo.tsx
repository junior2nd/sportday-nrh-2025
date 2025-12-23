'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'w-8 h-8',
    text: 'text-lg',
    iconText: 'text-lg',
  },
  md: {
    icon: 'w-10 h-10',
    text: 'text-xl',
    iconText: 'text-xl',
  },
  lg: {
    icon: 'w-12 h-12',
    text: 'text-2xl',
    iconText: 'text-2xl',
  },
};

export default memo(function Logo({
  href,
  size = 'md',
  showText = true,
  className = '',
}: LogoProps) {
  const sizes = sizeClasses[size];
  const content = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizes.icon} relative rounded-xl flex items-center justify-center overflow-hidden`}>
        <Image
          src="/images/Logonrh.png"
          alt="โรงพยาบาลนางรอง"
          fill
          className="object-contain"
          sizes={`${size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px'}`}
        />
      </div>
      {showText && (
        <h1 className={`${sizes.text}  text-gray-900`}>โรงพยาบาลนางรอง</h1>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
});

