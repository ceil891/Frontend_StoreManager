import { create } from 'zustand';
import { permissionService } from '../services/permissionService';

export interface Permission {
  id: string;
  permissionCode: string;
  module: string;
  description: string;
  status: 'KÍCH_HOẠT' | 'KHOÁ';
  createdAt: string;
  tenantId?: string;
  version?: number;
}

export interface GroupedPermission {
  module: string;
  permissions: Permission[];
}

interface PermissionState {
  permissions: Permission[];
  groupedPermissions: GroupedPermission[];
  isLoading: boolean;
  error: string | null;

  fetchPermissions: () => Promise<void>;
  fetchGroupedPermissions: () => Promise<void>;
  addPermission: (item: Partial<Permission>) => Promise<Permission>;
  updatePermission: (id: string, item: Partial<Permission>) => Promise<Permission>;
  deletePermission: (id: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionState>()((set) => ({
  permissions: [],
  groupedPermissions: [],
  isLoading: false,
  error: null,

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionService.fetchPermissions();
      set({ permissions: data, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách quyền' });
    }
  },

  fetchGroupedPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await permissionService.fetchGroupedPermissions();
      set({ groupedPermissions: data, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch grouped permissions:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải nhóm quyền' });
    }
  },

  addPermission: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const created = await permissionService.addPermission(item);
      set((state) => ({
        permissions: [created, ...state.permissions.filter((p) => p.id !== created.id)],
        isLoading: false,
      }));
      return created;
    } catch (err: any) {
      console.error('Failed to add permission:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tạo quyền mới' });
      throw err;
    }
  },

  updatePermission: async (id, item) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await permissionService.updatePermission(id, item);
      set((state) => ({
        permissions: state.permissions.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      console.error('Failed to update permission:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật quyền' });
      throw err;
    }
  },

  deletePermission: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await permissionService.deletePermission(id);
      set((state) => ({
        permissions: state.permissions.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to delete permission:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi xóa quyền' });
      throw err;
    }
  },
}));
