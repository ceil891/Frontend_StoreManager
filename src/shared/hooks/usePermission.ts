import { useAuthRole } from '@/features/auth/store/authStore';
import { useRoleStore } from '@/features/hr/store/roleStore';

/** Kiểm tra quyền RBAC của user hiện tại (theo role trong auth + roleStore). */
export function usePermission(permissionKey: string): boolean {
  const role = useAuthRole();
  const checkPermission = useRoleStore((s) => s.checkPermission);
  if (!role) return false;
  return checkPermission(role, permissionKey);
}
