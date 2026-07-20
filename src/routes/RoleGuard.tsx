import { Navigate, Outlet } from 'react-router';
import { useAuthRole, useAuthPermissions } from '@/features/auth/store/authStore';
import type { RoleType } from '@/features/auth/types';

interface RoleGuardProps {
  allowedRoles?: RoleType[];
  requiredPermission?: string;
}

export function RoleGuard({ allowedRoles, requiredPermission }: RoleGuardProps) {
  const role = useAuthRole();
  const permissions = useAuthPermissions();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền động từ backend
  if (requiredPermission) {
    if (!permissions.includes(requiredPermission)) {
      return <Navigate to="/403" replace />;
    }
    return <Outlet />;
  }

  // Fallback kiểm tra role tĩnh (legacy)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
