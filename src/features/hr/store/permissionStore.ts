import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';

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

interface PermissionState {
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;

  fetchPermissions: () => Promise<void>;
}

export const usePermissionStore = create<PermissionState>()((set) => ({
  permissions: [],
  isLoading: false,
  error: null,

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<any, any[]>('/permissions');
      const mapped = response.map((p: any) => ({
        id: String(p.id),
        permissionCode: p.permissionCode || '',
        module: p.module || 'Hệ thống',
        description: p.description || '',
        status: (p.isActive ? 'KÍCH_HOẠT' : 'KHOÁ') as 'KÍCH_HOẠT' | 'KHOÁ',
        createdAt: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        tenantId: p.tenantId || 'tenant-1',
        version: p.version || 1,
      }));
      set({ permissions: mapped, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách quyền' });
    }
  },
}));
