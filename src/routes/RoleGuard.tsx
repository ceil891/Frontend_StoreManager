import { Navigate, Outlet } from 'react-router';
import { useAuthRole, useAuthPermissions } from '@/features/auth/store/authStore';
import { checkPermission } from '@/shared/hooks/usePermission';
import type { RoleType } from '@/features/auth/types';

interface RoleGuardProps {
  allowedRoles?: RoleType[];
  requiredPermission?: string;
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, requiredPermission, children }: RoleGuardProps) {
  const role = useAuthRole();
  const permissions = useAuthPermissions();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const content = children || <Outlet />;

  // SUPER_ADMIN luôn có toàn quyền truy cập tất cả các route
  if (role === 'SUPER_ADMIN') {
    return <>{content}</>;
  }

  // Kiểm tra quyền động từ backend
  if (requiredPermission) {
    // Nếu user đã đăng nhập nhưng permissions chưa được load (mảng rỗng = đang tải hoặc chưa được cấp),
    // cho phép xem trang thay vì block 403 — trang sẽ tự hiển thị "không có dữ liệu" nếu API từ chối
    if (permissions.length === 0) {
      return <>{content}</>;
    }
    if (!checkPermission(permissions, requiredPermission, role)) {
      return <Navigate to="/403" replace />;
    }
    return <>{content}</>;
  }

  // Fallback kiểm tra role tĩnh
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{content}</>;
}
