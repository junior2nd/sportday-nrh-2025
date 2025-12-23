'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { storage } from '@/lib/utils/storage';
import { coreApi, LoginPageSettings } from '@/lib/api/core';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, checkAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [settings, setSettings] = useState<LoginPageSettings>({
    background_image: '/images/login-bg.png',
    show_logo: true,
    logo_text: 'N',
    logo_image: '',
    title: 'NRSport',
    subtitle: 'ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน',
    overlay_opacity: 0.5,
  });

  // Load login page settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = storage.getUser();
        const orgId = user?.org_id;
        const loginSettings = await coreApi.getLoginSettings(orgId);
        setSettings(loginSettings);
      } catch (error) {
        // Use default settings if API fails
        console.error('Failed to load login settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Check auth only if token exists
  useEffect(() => {
    const check = async () => {
      const token = storage.getToken();
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        await checkAuth();
        // If authenticated, redirect will happen in next useEffect
      } catch (error) {
        // Token invalid, clear it
        storage.removeTokens();
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      // Check if there's a selected event in storage
      const storedEvent = localStorage.getItem('selectedEvent');
      if (storedEvent) {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard/event-selection');
      }
    }
  }, [isAuthenticated, isChecking, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ username, password });
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      // Check if there's a selected event in storage
      const storedEvent = localStorage.getItem('selectedEvent');
      if (storedEvent) {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard/event-selection');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
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
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${settings.background_image})`,
        }}
      >
        {/* Overlay for better readability */}
        <div 
          className="absolute inset-0 bg-black"
          style={{
            opacity: settings.overlay_opacity,
          }}
        ></div>
      </div>
      
      {/* Login Form */}
      <div className="relative z-10 max-w-md w-full space-y-8 p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 mx-4">
        <div className="text-center">
          {settings.show_logo && (
            <div className="flex items-center justify-center mb-4">
              {settings.logo_image ? (
                <img 
                  src={settings.logo_image} 
                  alt="Logo" 
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{settings.logo_text}</span>
                </div>
              )}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{settings.title}</h1>
          <p className="mt-2 text-gray-600">{settings.subtitle}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="กรอกรหัสผ่าน"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

