'use client';

import { memo, useState, useEffect, FormEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
  showButton?: boolean;
  debounceMs?: number;
}

export default memo(function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'ค้นหา...',
  className = '',
  showButton = true,
  debounceMs,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs && debounceMs > 0) {
      const timer = setTimeout(() => {
        onChange(localValue);
      }, debounceMs);
      return () => clearTimeout(timer);
    }
  }, [localValue, debounceMs, onChange]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(localValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      {showButton && (
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
        >
          ค้นหา
        </button>
      )}
    </form>
  );
});

