'use client';

import { useHeader } from './HeaderContext';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventsApi } from '@/lib/api/events';
import { useEffect, useState } from 'react';

export default function Header() {
  const { title, subtitle, actionButton } = useHeader();
  const { selectedEvent } = useEvent();
  const [eventName, setEventName] = useState<string | null>(null);

  useEffect(() => {
    const loadEventName = async () => {
      if (selectedEvent) {
        try {
          const event = await eventsApi.get(selectedEvent);
          setEventName(event.name);
        } catch (error) {
          console.error('Error loading event:', error);
          setEventName(null);
        }
      } else {
        setEventName(null);
      }
    };
    loadEventName();
  }, [selectedEvent]);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {eventName && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">กิจกรรม: {eventName}</p>
            )}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>
      </div>
    </header>
  );
}

