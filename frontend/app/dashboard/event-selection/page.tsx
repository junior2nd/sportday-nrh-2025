'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEvent } from '@/lib/contexts/EventContext';
import { eventsApi, Event } from '@/lib/api/events';
import { coreApi, LoginPageSettings } from '@/lib/api/core';
import EventCard from '@/components/events/EventCard';
import EventStatusConfigModal from '@/components/events/EventStatusConfigModal';

export default function EventSelectionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { setSelectedEvent } = useEvent();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LoginPageSettings>({
    background_image: '/images/login-bg.png',
    show_logo: true,
    logo_text: 'N',
    logo_image: '',
    title: 'NRSport',
    subtitle: 'ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน',
    overlay_opacity: 0.5,
  });
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedEventForConfig, setSelectedEventForConfig] = useState<Event | null>(null);

  // Load login page settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { storage } = await import('@/lib/utils/storage');
        const user = storage.getUser();
        const orgId = user?.org_id;
        const loginSettings = await coreApi.getLoginSettings(orgId);
        setSettings(loginSettings);
      } catch (error) {
        console.error('Failed to load login settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/dashboard/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await eventsApi.list();
        // Sort: active first, then draft, then completed, then cancelled
        const sorted = [...data].sort((a, b) => {
          const order = { active: 0, draft: 1, completed: 2, cancelled: 3 };
          return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        });
        setEvents(sorted);
      } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated]);

  const handleSelectEvent = (eventId: number) => {
    setSelectedEvent(eventId);
    router.push('/dashboard');
  };

  const handleConfigEvent = (event: Event) => {
    setSelectedEventForConfig(event);
    setConfigModalOpen(true);
  };

  const handleStatusUpdated = () => {
    // Reload events
    const loadEvents = async () => {
      try {
        const data = await eventsApi.list();
        const sorted = [...data].sort((a, b) => {
          const order = { active: 0, draft: 1, completed: 2, cancelled: 3 };
          return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        });
        setEvents(sorted);
      } catch (error) {
        console.error('Error reloading events:', error);
      }
    };
    loadEvents();
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${settings.background_image})`,
        }}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black"
          style={{
            opacity: settings.overlay_opacity,
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {settings.show_logo && (
              <div className="flex items-center justify-center mb-4">
                {settings.logo_image ? (
                  <img 
                    src={settings.logo_image} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">{settings.logo_text}</span>
                  </div>
                )}
              </div>
            )}
            <h1 className="text-4xl font-bold text-white mb-2">{settings.title}</h1>
            <p className="text-white/90 text-lg">{settings.subtitle}</p>
            <p className="text-white/80 mt-4">เลือกกิจกรรมที่ต้องการจัดการ</p>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-white">กำลังโหลดกิจกรรม...</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white text-lg">ยังไม่มีกิจกรรม</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={handleSelectEvent}
                  onConfig={handleConfigEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Config Modal */}
      <EventStatusConfigModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedEventForConfig(null);
        }}
        event={selectedEventForConfig}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}

