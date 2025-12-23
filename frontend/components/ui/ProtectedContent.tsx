'use client';

import { ReactNode } from 'react';
import { useRole } from '@/lib/hooks/useRole';
import { UserRole } from '@/types';

interface ProtectedContentProps {
  children: ReactNode;
  roles?: UserRole[];
  requireAdmin?: boolean;
  requireStaff?: boolean;
  requireJudge?: boolean;
  fallback?: ReactNode;
}

export default function ProtectedContent({
  children,
  roles,
  requireAdmin,
  requireStaff,
  requireJudge,
  fallback = null,
}: ProtectedContentProps) {
  const { role, isAdmin, isStaff, isJudge } = useRole();

  if (!role) {
    return <>{fallback}</>;
  }

  if (roles && !roles.includes(role)) {
    return <>{fallback}</>;
  }

  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>;
  }

  if (requireStaff && !isStaff() && !isAdmin()) {
    return <>{fallback}</>;
  }

  if (requireJudge && !isJudge() && !isStaff() && !isAdmin()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


