import { Navigate, Outlet } from 'react-router';
import { useAuthRole, useAuthPermissions } from '@/features/auth/store/authStore';
import { checkPermission } from '@/shared/hooks/usePermission';
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

  // SUPER_ADMIN luôn có toàn quyền truy cập tất cả các route
  if (role === 'SUPER_ADMIN') {
    return <Outlet />;
  }

  // Kiểm tra quyền động từ backend
  if (requiredPermission) {
    if (!checkPermission(permissions, requiredPermission, role)) {
      return <Navigate to="/403" replace />;
    }
    return <Outlet />;
  }

  // Fallback kiểm tra role tĩnh
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
