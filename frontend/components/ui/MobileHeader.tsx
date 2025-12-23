'use client';

import Logo from './Logo';

export default function MobileHeader() {
  return (
    <header className="md:hidden pt-4 pb-2">
      <div className="grid items-center bg-white/50 border border-gray-100 shadow-lg mx-3 px-4 py-2.5 rounded-full">
        <Logo href="/" size="sm" />
      </div>
    </header>
  );
}

