import { Navigate, Outlet } from 'react-router';
import { useAuthRole } from '@/features/auth/store/authStore';
import { useRoleStore } from '@/features/hr/store/roleStore';
import type { RoleType } from '@/features/auth/types';

interface RoleGuardProps {
  allowedRoles?: RoleType[];
  requiredPermission?: string;
}

export function RoleGuard({ allowedRoles, requiredPermission }: RoleGuardProps) {
  const role = useAuthRole();
  const checkPermission = useRoleStore((s) => s.checkPermission);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Check dynamic permissions if provided
  if (requiredPermission) {
    if (!checkPermission(role, requiredPermission)) {
      return <Navigate to="/403" replace />;
    }
    return <Outlet />;
  }

  // Fallback to legacy role checks
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
