import { useMemo } from 'react';
import { useAuthStore, useAuthPermissions, useAuthRole } from '@/features/auth/store/authStore';
import type { User } from '@/features/auth/types';

/**
 * Hàm kiểm tra mã quyền đối chiếu với danh sách permissions của người dùng
 */
export function checkPermission(permissions: string[], permissionKey?: string, role?: string | null): boolean {
  if (role === 'SUPER_ADMIN' || role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_SYSTEM_ADMIN') return true;
  if (!permissionKey) return true;
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*') || permissions.includes('ALL')) return true;
  if (permissions.includes(permissionKey)) return true;

  // Wildcard match e.g. catalog:category:view matches catalog:* or catalog:category:*
  const parts = permissionKey.split(':');
  if (parts.length >= 2) {
    const domainWildcard = `${parts[0]}:*`;
    const resourceWildcard = `${parts[0]}:${parts[1]}:*`;
    if (permissions.includes(domainWildcard) || permissions.includes(resourceWildcard)) {
      return true;
    }
  }

  return false;
}

export interface PermissionContextResult {
  user: User | null;
  permissions: string[];
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  canViewAllBranches: boolean;
  currentBranchId: string | null;
  currentBranchName: string;
}

/**
 * Hook kiểm tra quyền động toàn diện cho React Components
 */
export function usePermission(): PermissionContextResult;
export function usePermission(permissionKey: string): boolean;
export function usePermission(permissionKey?: string): boolean | PermissionContextResult {
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthPermissions();
  const role = useAuthRole();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const r = user.role as string;
    const userRoles = (user as any).roles || [];
    return (
      r === 'SUPER_ADMIN' ||
      r === 'ROLE_SUPER_ADMIN' ||
      r === 'ROLE_SYSTEM_ADMIN' ||
      userRoles.includes('ROLE_SUPER_ADMIN') ||
      userRoles.includes('ROLE_SYSTEM_ADMIN') ||
      permissions.includes('system:branch:view_all') ||
      permissions.includes('branch:view_all') ||
      permissions.includes('*')
    );
  }, [user, permissions]);

  const hasPermission = (key: string): boolean => {
    return checkPermission(permissions, key, role);
  };

  const hasAnyPermission = (keys: string[]): boolean => {
    return keys.some((k) => checkPermission(permissions, k, role));
  };

  const hasAllPermissions = (keys: string[]): boolean => {
    return keys.every((k) => checkPermission(permissions, k, role));
  };

  const hasRole = (roleCode: string): boolean => {
    if (!user) return false;
    if (user.role === roleCode) return true;
    const userRoles = (user as any).roles || [];
    return userRoles.includes(roleCode) || userRoles.includes(`ROLE_${roleCode}`);
  };

  // Nếu truyền param key -> trả về boolean trực tiếp (backward compatible)
  if (typeof permissionKey === 'string') {
    return hasPermission(permissionKey);
  }

  const currentBranchId = user?.branchId ? String(user.branchId) : null;
  const currentBranchName = user?.branchName || (currentBranchId ? `Chi nhánh ${currentBranchId}` : '');

  return {
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canViewAllBranches: isSuperAdmin,
    currentBranchId,
    currentBranchName,
  };
}

/**
 * Hook kiểm tra bộ quyền CRUD đầy đủ theo domain & resource
 */
export function useCrudPermissions(domain: string, resource: string) {
  const permissions = useAuthPermissions();
  const role = useAuthRole();

  const canView = checkPermission(permissions, `${domain}:${resource}:view`, role);
  const canCreate = checkPermission(permissions, `${domain}:${resource}:create`, role);
  const canUpdate = checkPermission(permissions, `${domain}:${resource}:update`, role);
  const canDelete = checkPermission(permissions, `${domain}:${resource}:delete`, role);

  return {
    canView,
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin: (role as string) === 'SUPER_ADMIN' || (role as string) === 'ROLE_SUPER_ADMIN' || (role as string) === 'ROLE_SYSTEM_ADMIN',
  };
}
