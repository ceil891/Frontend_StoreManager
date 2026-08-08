import { axiosClient } from '@/shared/lib/axiosClient';
import type { SecurityRoleRecord, RoleUser } from '../store/roleStore';

export const roleService = {
  async fetchRoles(): Promise<SecurityRoleRecord[]> {
    const response = await axiosClient.get<any, any>('/roles');
    const rawList = Array.isArray(response) ? response : (response?.content || response?.data || response?.items || []);
    return rawList.map((r: any) => ({
      id: String(r.id),
      roleCode: r.roleCode || r.roleName || '',
      roleTitle: r.roleTitle || r.roleName || '',
      description: r.description || '',
      assignedUsersCount: r.assignedUsersCount || 0,
      permissionScope: r.permissionScope || 'BRANCH_OPERATIONS',
      dataScopeBranchIds: r.dataScopeBranchIds || [],
      isSystemRole: !!r.isSystemRole,
      mfaEnforced: !!r.mfaEnforced,
      sessionTimeoutMinutes: r.sessionTimeoutMinutes || 60,
      status: r.status || (r.isActive ? 'ACTIVE' : 'DEPRECATED'),
      createdDate: r.createdDate ? r.createdDate.split('T')[0] : new Date().toISOString().split('T')[0],
      grantedPermissions: r.grantedPermissions || r.permissions?.map((p: any) => p.permissionCode || p.code || p) || [],
      color: r.color || '#10b981',
    }));
  },

  async addRole(role: Omit<SecurityRoleRecord, 'id' | 'createdDate' | 'assignedUsersCount'>): Promise<SecurityRoleRecord> {
    const payload = {
      roleCode: role.roleCode,
      roleName: role.roleTitle,
      roleTitle: role.roleTitle,
      description: role.description,
      status: role.status,
      color: role.color,
      permissionScope: role.permissionScope,
      grantedPermissions: role.grantedPermissions,
    };
    const res = await axiosClient.post<any, any>('/roles', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      roleCode: item?.roleCode || role.roleCode,
      roleTitle: item?.roleTitle || role.roleTitle,
      description: item?.description || role.description,
      assignedUsersCount: 0,
      permissionScope: item?.permissionScope || role.permissionScope || 'BRANCH_OPERATIONS',
      status: item?.status || role.status || 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0],
      grantedPermissions: item?.grantedPermissions || role.grantedPermissions || [],
      color: item?.color || role.color || '#10b981',
      mfaEnforced: !!role.mfaEnforced,
      sessionTimeoutMinutes: role.sessionTimeoutMinutes || 60,
    };
  },

  async updateRole(role: SecurityRoleRecord): Promise<SecurityRoleRecord> {
    const payload = {
      roleCode: role.roleCode,
      roleName: role.roleTitle,
      roleTitle: role.roleTitle,
      description: role.description,
      status: role.status,
      color: role.color,
      permissionScope: role.permissionScope,
      grantedPermissions: role.grantedPermissions,
    };
    const res = await axiosClient.put<any, any>(`/roles/${role.id}`, payload);
    const item = res?.data || res;
    return {
      ...role,
      ...(item || {}),
      id: role.id,
    };
  },

  async deleteRole(id: string): Promise<void> {
    await axiosClient.delete(`/roles/${id}`);
  },

  async cloneRole(sourceRoleId: string, newRoleCode: string, newRoleTitle: string, newDescription: string): Promise<SecurityRoleRecord> {
    const res = await axiosClient.post<any, any>(`/roles/${sourceRoleId}/clone`, {
      roleCode: newRoleCode,
      roleTitle: newRoleTitle,
      description: newDescription,
    });
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      roleCode: newRoleCode,
      roleTitle: newRoleTitle,
      description: newDescription,
      assignedUsersCount: 0,
      permissionScope: item?.permissionScope || 'BRANCH_OPERATIONS',
      status: 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0],
      grantedPermissions: item?.grantedPermissions || [],
      color: item?.color || '#10b981',
      mfaEnforced: false,
      sessionTimeoutMinutes: 60,
    };
  },

  async fetchRoleUsers(roleId: string): Promise<RoleUser[]> {
    const res = await axiosClient.get<any, any>(`/roles/${roleId}/users`);
    const data = Array.isArray(res) ? res : (res?.content || []);
    return data.map((u: any) => ({
      id: String(u.id),
      fullName: u.fullName || u.username || 'User',
      email: u.email || '',
      avatarUrl: u.avatarUrl,
      isAssigned: !!u.isAssigned,
    }));
  },
};
