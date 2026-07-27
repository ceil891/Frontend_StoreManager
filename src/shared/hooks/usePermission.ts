import { useAuthPermissions } from '@/features/auth/store/authStore';

/**
 * Kiểm tra xem user hiện tại có quyền `permissionKey` không.
 * Dữ liệu lấy từ backend (qua authStore.user.permissions) sau khi login.
 */
export function usePermission(permissionKey: string): boolean {
  const permissions = useAuthPermissions();
  return permissions.includes(permissionKey);
}
