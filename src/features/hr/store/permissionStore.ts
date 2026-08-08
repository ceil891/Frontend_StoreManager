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
}));
