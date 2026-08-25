import React from 'react';
import { usePermission } from '@/shared/hooks/usePermission';

export interface PermissionGuardProps {
  /**
   * Mã quyền hoặc mảng mã quyền cần kiểm tra (ví dụ: 'sales:order:create' hoặc ['sales:order:create', 'sales:order:update'])
   */
  permission?: string | string[];
  /**
   * Yêu cầu phải có TẤT CẢ các quyền trong mảng (mặc định false: chỉ cần 1 trong các quyền)
   */
  requireAll?: boolean;
  /**
   * Component fallback hiển thị khi không có quyền (mặc định: null)
   */
  fallback?: React.ReactNode;
  /**
   * Nội dung hiển thị khi có quyền
   */
  children: React.ReactNode;
}

/**
 * Wrapper Component kiểm soát hiển thị các phần tử UI (Button, Menu, Action, Column) theo Dynamic Permission
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canViewAllBranches } = usePermission();

  // Không yêu cầu quyền -> Render luôn
  if (!permission || (Array.isArray(permission) && permission.length === 0)) {
    return <>{children}</>;
  }

  // Super Admin / Toàn quyền
  if (canViewAllBranches) {
    return <>{children}</>;
  }

  let isAllowed = false;

  if (Array.isArray(permission)) {
    isAllowed = requireAll
      ? (hasAllPermissions ? hasAllPermissions(permission) : permission.every((p) => hasPermission(p)))
      : (hasAnyPermission ? hasAnyPermission(permission) : permission.some((p) => hasPermission(p)));
  } else {
    isAllowed = hasPermission(permission);
  }

  if (!isAllowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
