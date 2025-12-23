'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '@/lib/hooks/useRole';
import { getRoleDisplay } from '@/lib/utils/format';
import { useState, useEffect, useMemo, startTransition } from 'react';
import { coreApi, LoginPageSettings } from '@/lib/api/core';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  User,
  Gift, 
  Trophy, 
  Edit3,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Package,
  Building2,
  Award
} from 'lucide-react';
import EventExitModal from './EventExitModal';
import { useEvent } from '@/lib/contexts/EventContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  section?: string;
  hidden?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'MAIN' },
  { name: 'กิจกรรม', href: '/dashboard/events', icon: Calendar, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'MAIN' },
  { name: 'แผนก', href: '/dashboard/departments', icon: Building2, roles: ['superadmin', 'org_admin'], section: 'MAIN' },
  { name: 'รายชื่อ', href: '/dashboard/participants', icon: User, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'MAIN' },
  { name: 'ทีม', href: '/dashboard/teams', icon: Users, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'กีฬา', hidden: true },
  { name: 'กีฬา', href: '/dashboard/sports', icon: Trophy, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'กีฬา', hidden: true },
  { name: 'ลงคะแนน', href: '/dashboard/sports/score', icon: Edit3, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'กีฬา', hidden: true },
  { name: 'จับสลาก', href: '/dashboard/raffle', icon: Gift, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'รางวัล' },
  { name: 'รางวัล', href: '/dashboard/prizes', icon: Package, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'รางวัล' },
  { name: 'รายชื่อผู้ได้รับรางวัล', href: '/dashboard/winners', icon: Award, roles: ['superadmin', 'org_admin', 'staff', 'viewer'], section: 'รางวัล' },
];

// Helper function to check if user has required role
const hasRole = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  return userRole ? allowedRoles.includes(userRole) : false;
};

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useRole();
  const { clearSelectedEvent } = useEvent();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loginSettings, setLoginSettings] = useState<LoginPageSettings | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  const handleNavigation = (href: string) => {
    if (pathname === href) return; // Already on this page
    startTransition(() => {
      router.push(href);
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const orgId = user?.org_id;
        const settings = await coreApi.getLoginSettings(orgId);
        setLoginSettings(settings);
      } catch (error) {
        console.error('Failed to load login settings:', error);
      }
    };
    loadSettings();
  }, [user?.org_id]);

  const filteredNavItems = useMemo(() => 
    navItems.filter(item => hasRole(role, item.roles) && !item.hidden),
    [role]
  );

  const groupedItems = useMemo(() => 
    filteredNavItems.reduce((acc, item) => {
      const section = item.section || 'OTHER';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>),
    [filteredNavItems]
  );

  if (isCollapsed) {
    return (
      <div className="w-16 bg-zinc-200 min-h-screen flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="mb-6 p-2 text-emerald-600 hover:bg-emerald-600/20 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {filteredNavItems.map((item) => {
          // For Dashboard, only match exact path. For others, match path and sub-paths
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          const IconComponent = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`p-3 mb-2 rounded-lg transition-colors flex items-center justify-center w-full ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-800'
                  : 'text-gray-600 hover:bg-emerald-600/20 hover:text-emerald-800'
              }`}
              title={item.name}
            >
              <IconComponent className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-64 bg-zinc-200 text-white min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {loginSettings?.logo_image ? (
              <img 
                src={loginSettings.logo_image} 
                alt="Logo" 
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {loginSettings?.logo_text || 'N'}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-emerald-800">
              {loginSettings?.title || 'NRSport'}
            </h1>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-emerald-600 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            {section !== 'MAIN' && (
              <div className="px-6 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section}</p>
              </div>
            )}
            {items.map((item) => {
              // For Dashboard, only match exact path. For others, match path and sub-paths
              const isActive = item.href === '/dashboard' 
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(item.href + '/');
              const IconComponent = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center px-6 py-3 text-sm w-full text-left transition-colors relative ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-800'
                      : 'text-gray-600 hover:bg-emerald-600/10 hover:text-emerald-800'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  )}
                  <IconComponent className="mr-3 w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-300 p-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-800 font-semibold text-sm">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 truncate">{user.username || 'User'}</p>
                <p className="text-xs text-gray-600 truncate">{getRoleDisplay(role || '')}</p>
                {user.org_name && (
                  <p className="text-xs text-gray-400 truncate">{user.org_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setExitModalOpen(true)}
              className="shrink-0 p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
              title="ออกจาก Event"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">?</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300 truncate">Loading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Event Exit Modal */}
      <EventExitModal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        onLogout={async () => {
          if (onLogout) {
            await onLogout();
          } else {
            router.push('/dashboard/login');
          }
        }}
        onSelectOtherEvent={() => {
          clearSelectedEvent();
          router.push('/dashboard/event-selection');
        }}
      />
    </div>
  );
}

