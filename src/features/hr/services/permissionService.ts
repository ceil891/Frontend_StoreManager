import { axiosClient } from '@/shared/lib/axiosClient';
import type { Permission, GroupedPermission } from '../store/permissionStore';

export const permissionService = {
  async fetchPermissions(): Promise<Permission[]> {
    const response: any = await axiosClient.get<any, any>('/permissions');
    const rawList = Array.isArray(response) ? response : (response?.content || response?.data || []);
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
    const response: any = await axiosClient.get<any, any>('/permissions/grouped');
    const rawList = Array.isArray(response) ? response : (response?.content || response?.data || []);
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

  async addPermission(item: Partial<Permission>): Promise<Permission> {
    const payload = {
      permissionCode: item.permissionCode,
      module: item.module,
      description: item.description,
      isActive: item.status !== 'KHOÁ',
    };
    const res = await axiosClient.post<any, any>('/permissions', payload);
    return {
      id: String(res?.id || Date.now()),
      permissionCode: res?.permissionCode || item.permissionCode || '',
      module: res?.module || item.module || 'Hệ thống',
      description: res?.description || item.description || '',
      status: (res?.isActive !== false ? 'KÍCH_HOẠT' : 'KHOÁ'),
      createdAt: res?.createdAt ? res.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      tenantId: res?.tenantId || 'tenant-1',
      version: res?.version || 1,
    };
  },

  async updatePermission(id: string, item: Partial<Permission>): Promise<Permission> {
    const payload = {
      permissionCode: item.permissionCode,
      module: item.module,
      description: item.description,
      isActive: item.status !== 'KHOÁ',
    };
    const res = await axiosClient.put<any, any>(`/permissions/${id}`, payload);
    return {
      id: String(res?.id || id),
      permissionCode: res?.permissionCode || item.permissionCode || '',
      module: res?.module || item.module || 'Hệ thống',
      description: res?.description || item.description || '',
      status: (res?.isActive !== false ? 'KÍCH_HOẠT' : 'KHOÁ'),
      createdAt: res?.createdAt ? res.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      tenantId: res?.tenantId || 'tenant-1',
      version: res?.version || 1,
    };
  },

  async deletePermission(id: string): Promise<void> {
    await axiosClient.delete(`/permissions/${id}`);
  },
};
