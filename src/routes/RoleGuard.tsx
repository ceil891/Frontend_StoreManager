import { Navigate, Outlet } from 'react-router';
import { usePermission } from '@/shared/hooks/usePermission';

export interface RoleGuardProps {
  /**
   * Mã quyền bắt buộc (ví dụ: 'catalog:product:view')
   */
  requiredPermission?: string;
  /**
   * Danh sách mã quyền (chỉ cần có 1 trong các quyền này)
   */
  requiredPermissions?: string[];
  /**
   * Danh sách Role fallback (backward compatible)
   */
  allowedRoles?: string[];
  children?: React.ReactNode;
}

/**
 * Route Guard động 100% bảo vệ Route dựa trên Dynamic Permissions
 */
export function RoleGuard({ requiredPermission, requiredPermissions, allowedRoles, children }: RoleGuardProps) {
  const { user, permissions, hasPermission, hasAnyPermission, canViewAllBranches } = usePermission();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const content = children || <Outlet />;

  // Super Admin hoặc sở hữu quyền Wildcard (*) luôn được phép truy cập
  if (canViewAllBranches || permissions.includes('*') || permissions.includes('ALL')) {
    return <>{content}</>;
  }

  // Kiểm tra requiredPermission đơn lẻ
  if (requiredPermission) {
    if (permissions.length === 0) {
      return <>{content}</>;
    }
    if (!hasPermission(requiredPermission)) {
      return <Navigate to="/403" replace />;
    }
    return <>{content}</>;
  }

  // Kiểm tra mảng requiredPermissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (permissions.length === 0) {
      return <>{content}</>;
    }
    if (!hasAnyPermission(requiredPermissions)) {
      return <Navigate to="/403" replace />;
    }
    return <>{content}</>;
  }

  // Fallback backward compatible cho allowedRoles nếu route cũ chưa chuyển sang permission
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || '';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{content}</>;
}
