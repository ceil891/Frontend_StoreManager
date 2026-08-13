import { useAuthPermissions, useAuthRole } from '@/features/auth/store/authStore';

/**
 * Utility function to evaluate whether user permissions satisfy permissionKey
 */
export function checkPermission(permissions: string[], permissionKey?: string, role?: string | null): boolean {
  if (role === 'SUPER_ADMIN') return true;
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

/**
 * Hook kiểm tra quyền động từ backend cho UI
 */
export function usePermission(permissionKey: string): boolean {
  const permissions = useAuthPermissions();
  const role = useAuthRole();
  return checkPermission(permissions, permissionKey, role);
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
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}

