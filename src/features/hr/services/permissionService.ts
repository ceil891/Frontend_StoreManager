import { axiosClient } from '@/shared/lib/axiosClient';
import type { Permission, GroupedPermission } from '../store/permissionStore';

export const permissionService = {
  async fetchPermissions(): Promise<Permission[]> {
    const response = await axiosClient.get<any, any[]>('/permissions');
    const rawList = Array.isArray(response) ? response : (response?.content || []);
    return rawList.map((p: any) => ({
      id: String(p.id),
      permissionCode: p.permissionCode || '',
      module: p.module || 'Hệ thống',
      description: p.description || '',
      status: (p.isActive ? 'KÍCH_HOẠT' : 'KHOÁ') as 'KÍCH_HOẠT' | 'KHOÁ',
      createdAt: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      tenantId: p.tenantId || 'tenant-1',
      version: p.version || 1,
    }));
  },

  async fetchGroupedPermissions(): Promise<GroupedPermission[]> {
    const response = await axiosClient.get<any, any[]>('/permissions/grouped');
    const rawList = Array.isArray(response) ? response : (response?.content || []);
    return (rawList || []).map((g: any) => ({
      module: g.module || '',
      permissions: (g.permissions || []).map((p: any) => ({
        id: String(p.id),
        permissionCode: p.permissionCode || '',
        module: p.module || g.module || '',
        description: p.description || '',
        status: (p.isActive ? 'KÍCH_HOẠT' : 'KHOÁ') as 'KÍCH_HOẠT' | 'KHOÁ',
        createdAt: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        tenantId: p.tenantId || 'tenant-1',
        version: p.version || 1,
      })),
    }));
  },
};
