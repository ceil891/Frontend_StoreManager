import { axiosClient } from '@/shared/lib/axiosClient';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import type { SystemUserRecord, SystemUserInput } from '../store/userStore';

export function branchLabel(branchId: string): string {
  if (branchId === 'HQ') return 'Trụ sở chính - TP.HCM';
  if (branchId === 'BR-001') return 'CH Quận 1';
  if (branchId === 'BR-002') return 'CH Tân Bình';
  if (branchId === 'BR-003') return 'CH Gò Vấp';
  if (branchId === 'BR-004') return 'CH Quận 7';
  if (branchId === 'BR-005') return 'CH Bình Dương';
  return branchId;
}

export function normalizeSystemUser(
  partial: Partial<SystemUserRecord> & Pick<SystemUserRecord, 'id' | 'emailAddress' | 'fullName'>
): SystemUserRecord {
  const email = partial.emailAddress;
  const branchId = partial.branchId ?? 'BR-001';
  return {
    id: partial.id,
    authUserId: partial.authUserId ?? partial.id,
    userCode: partial.userCode ?? `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName: partial.fullName,
    emailAddress: email,
    contactPhone: partial.contactPhone ?? '',
    avatarUrl: partial.avatarUrl?.trim() || buildUserAvatarUrl(email),
    assignedRole: partial.assignedRole ?? 'STAFF',
    departmentId: partial.departmentId ?? '1',
    branchId,
    branchLocation: partial.branchLocation ?? branchLabel(branchId),
    positionId: partial.positionId ?? '1',
    managerId: partial.managerId,
    timezone: partial.timezone ?? 'Asia/Ho_Chi_Minh',
    locale: partial.locale ?? 'vi-VN',
    identityId: partial.identityId,
    taxId: partial.taxId,
    dateOfBirth: partial.dateOfBirth,
    hireDate: partial.hireDate ?? new Date().toISOString().split('T')[0],
    employmentType: partial.employmentType ?? 'FULL_TIME',
    status: partial.status ?? 'ACTIVE',
    lastLoginTimestamp: partial.lastLoginTimestamp ?? 'Chưa từng đăng nhập',
    mfaEnabled: partial.mfaEnabled ?? false,
    faceEnrolled: partial.faceEnrolled ?? false,
    notes: partial.notes,
  };
}

export const userService = {
  async fetchUsers(): Promise<SystemUserRecord[]> {
    const response = await axiosClient.get<any, any>('/users');
    const rawUsers = Array.isArray(response) ? response : (response?.content || response?.data || response?.items || []);

    let roles: any[] = [];
    try {
      const roleRes = await axiosClient.get<any, any>('/roles');
      roles = Array.isArray(roleRes) ? roleRes : (roleRes?.content || roleRes?.data || roleRes?.items || []);
    } catch (roleErr) {
      console.warn('Failed to fetch roles, using fallback mapping:', roleErr);
    }

    return (Array.isArray(rawUsers) ? rawUsers : []).map((u: any) => {
      const roleObj = Array.isArray(roles) ? roles.find((r: any) => r.id === u.role?.id) : undefined;
      const roleName = roleObj?.roleName || u.role?.roleName || 'STAFF';

      return normalizeSystemUser({
        id: String(u.id),
        authUserId: String(u.id),
        userCode: `USR-${String(u.id).padStart(4, '0')}`,
        fullName: u.fullName || '',
        emailAddress: u.email || '',
        contactPhone: u.phone || '',
        avatarUrl: buildUserAvatarUrl(u.email || ''),
        assignedRole: roleName,
        departmentId: '1',
        branchId: u.branch?.id ? String(u.branch.id) : 'BR-001',
        branchLocation: u.branch?.branchName || 'CH Quận 1',
        positionId: '1',
        managerId: undefined,
        hireDate: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        status: u.status || 'ACTIVE',
        lastLoginTimestamp: 'Chưa từng đăng nhập',
        mfaEnabled: false,
        faceEnrolled: false,
      });
    });
  },

  async addUser(newUser: SystemUserInput): Promise<SystemUserRecord> {
    let roleId = 4;
    try {
      const roles = await axiosClient.get<any, any[]>('/roles');
      const roleObj = roles.find((r: any) => r.roleName === newUser.assignedRole);
      if (roleObj) roleId = roleObj.id;
    } catch (e) {}

    const payload = {
      username: newUser.emailAddress.split('@')[0],
      password: 'User@123',
      fullName: newUser.fullName,
      email: newUser.emailAddress,
      phone: newUser.contactPhone,
      roleId: Number(roleId),
      branchId: newUser.branchId ? Number(newUser.branchId) : 1,
      status: newUser.status || 'ACTIVE',
    };
    const res = await axiosClient.post<any, any>('/users', payload);
    const item = res?.data || res;
    return normalizeSystemUser({
      id: String(item?.id || Date.now()),
      ...newUser,
      ...(item || {}),
    });
  },

  async updateUser(updatedUser: SystemUserRecord): Promise<SystemUserRecord> {
    const userId = updatedUser.id;
    let roleId = 4;
    try {
      const roles = await axiosClient.get<any, any[]>('/roles');
      const roleObj = roles.find((r: any) => r.roleName === updatedUser.assignedRole);
      if (roleObj) roleId = roleObj.id;
    } catch (e) {}

    const payload = {
      fullName: updatedUser.fullName,
      email: updatedUser.emailAddress,
      phone: updatedUser.contactPhone,
      roleId: Number(roleId),
      branchId: updatedUser.branchId ? Number(updatedUser.branchId) : 1,
    };
    const res = await axiosClient.put<any, any>(`/users/${userId}`, payload);
    const item = res?.data || res;
    return {
      ...updatedUser,
      ...(item || {}),
    };
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await axiosClient.put(`/users/${id}/status?status=TERMINATED`);
    } catch (e) {}
    await axiosClient.delete(`/users/${id}`);
  },
};
