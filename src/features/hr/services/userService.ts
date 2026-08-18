import { axiosClient } from '@/shared/lib/axiosClient';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import { useBranchStore } from '@/features/system/store/branchStore';
import type { SystemUserRecord, SystemUserInput } from '../store/userStore';

export function branchLabel(branchId: string): string {
  if (!branchId || branchId === 'HQ') return 'Trụ sở chính';
  const branches = useBranchStore.getState().branches;
  const match = branches.find(b => b.id === String(branchId) || b.branchCode === branchId);
  if (match) return match.name;
  return `Chi nhánh ${branchId}`;
}

export function normalizeSystemUser(
  partial: Partial<SystemUserRecord> & Pick<SystemUserRecord, 'id' | 'emailAddress' | 'fullName'>
): SystemUserRecord {
  const email = partial.emailAddress;
  const branchId = partial.branchId ?? '1';
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

// Cache roles trong bộ nhớ để không phải gọi API mỗi lần
let _cachedRoles: any[] | null = null;
let _rolesCacheTime = 0;
const ROLES_CACHE_TTL = 60_000; // 1 phút

async function getCachedRoles(): Promise<any[]> {
  if (_cachedRoles && Date.now() - _rolesCacheTime < ROLES_CACHE_TTL) {
    return _cachedRoles;
  }
  try {
    const roleRes = await axiosClient.get<any, any>('/roles');
    _cachedRoles = Array.isArray(roleRes) ? roleRes : (roleRes?.content || roleRes?.data || roleRes?.items || []);
    _rolesCacheTime = Date.now();
  } catch {
    if (!_cachedRoles) _cachedRoles = [];
  }
  return _cachedRoles!;
}

export const userService = {
  async fetchUsers(): Promise<SystemUserRecord[]> {
    // Gọi song song cả 2 API cùng lúc thay vì tuần tự
    const [response, roles] = await Promise.all([
      axiosClient.get<any, any>('/users'),
      getCachedRoles(),
    ]);

    const rawUsers = Array.isArray(response) ? response : (response?.content || response?.data || response?.items || []);

    return (Array.isArray(rawUsers) ? rawUsers : []).map((u: any) => {
      const userRoleId = u.role?.id ? String(u.role.id) : (u.roleId ? String(u.roleId) : undefined);
      const roleObj = Array.isArray(roles) ? roles.find((r: any) => String(r.id) === userRoleId || r.roleName === (u.roleName || u.role?.roleName)) : undefined;
      const roleCode = roleObj?.roleCode || roleObj?.roleName || u.roleName || u.role?.roleName || 'STAFF';

      const rawBranchId = u.branch?.id ? String(u.branch.id) : (u.branchId ? String(u.branchId) : '');
      const branchName = u.branch?.branchName || u.branchName || u.branch?.name || (rawBranchId ? `Chi nhánh ${rawBranchId}` : '');

      const departmentId = u.departmentId ? String(u.departmentId) : (u.department?.id ? String(u.department.id) : '');
      const positionId = u.positionId ? String(u.positionId) : (u.position?.id ? String(u.position.id) : '');

      return normalizeSystemUser({
        id: String(u.id),
        authUserId: String(u.id),
        userCode: `USR-${String(u.id).padStart(4, '0')}`,
        fullName: u.fullName || '',
        emailAddress: u.email || '',
        contactPhone: u.phone || '',
        avatarUrl: buildUserAvatarUrl(u.email || ''),
        assignedRole: roleCode,
        departmentId,
        branchId: rawBranchId,
        branchLocation: branchName,
        positionId,
        managerId: undefined,
        identityId: u.identityId || '',
        taxId: u.taxId || '',
        dateOfBirth: u.dateOfBirth || '',
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
    const roles = await getCachedRoles();
    const roleObj = roles.find((r: any) => 
      String(r.id) === String(newUser.assignedRole) || 
      r.roleName === newUser.assignedRole || 
      r.roleCode === newUser.assignedRole
    );
    if (roleObj) roleId = Number(roleObj.id);

    const parsedBranchId = Number(String(newUser.branchId || '1').replace(/[^0-9]/g, '')) || 1;

    const payload = {
      username: newUser.emailAddress.split('@')[0],
      password: 'User@123',
      fullName: newUser.fullName,
      email: newUser.emailAddress,
      phone: newUser.contactPhone,
      roleId: Number(roleId),
      branchId: parsedBranchId,
      status: newUser.status || 'ACTIVE',
      taxId: newUser.taxId || '',
      identityId: newUser.identityId || '',
      dateOfBirth: newUser.dateOfBirth || '',
      departmentId: newUser.departmentId || '',
      positionId: newUser.positionId || '',
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
    let roleId: number | null = null;
    const roles = await getCachedRoles();
    const roleObj = roles.find((r: any) => 
      String(r.id) === String(updatedUser.assignedRole) || 
      r.roleName === updatedUser.assignedRole || 
      r.roleCode === updatedUser.assignedRole
    );
    if (roleObj) roleId = Number(roleObj.id);

    const parsedBranchId = Number(String(updatedUser.branchId || '1').replace(/[^0-9]/g, '')) || 1;

    // 1. Dedicated status API if changed/specified
    if (updatedUser.status) {
      try {
        await axiosClient.put(`/users/${userId}/status?status=${updatedUser.status}`);
      } catch (err) {
        console.warn('Dedicated status API call failed:', err);
      }
    }

    // 2. Dedicated role-branch API
    if (roleId || updatedUser.branchId) {
      try {
        const body: any = {};
        if (roleId) body.roleId = roleId;
        if (updatedUser.branchId) body.branchId = parsedBranchId;
        await axiosClient.put(`/users/${userId}/role-branch`, body);
      } catch (err) {
        console.warn('Dedicated role-branch API call failed, falling back to full update:', err);
      }
    }

    // 3. Cập nhật thông tin chung
    const payload: any = {
      fullName: updatedUser.fullName,
      email: updatedUser.emailAddress,
      phone: updatedUser.contactPhone,
      branchId: parsedBranchId,
      status: updatedUser.status || 'ACTIVE',
      taxId: updatedUser.taxId || '',
      identityId: updatedUser.identityId || '',
      dateOfBirth: updatedUser.dateOfBirth || '',
      departmentId: updatedUser.departmentId || '',
      positionId: updatedUser.positionId || '',
    };
    if (roleId) {
      payload.roleId = roleId;
    }

    const res = await axiosClient.put<any, any>(`/users/${userId}`, payload);
    const item = res?.data || res;
    return {
      ...updatedUser,
      ...(item || {}),
    };
  },

  async updateRoleAndBranch(userId: string, roleCode: string, branchId: string): Promise<void> {
    let roleId: number | null = null;
    try {
      const rolesRes = await axiosClient.get<any, any>('/roles');
      const roles = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.content || rolesRes?.data || []);
      const roleObj = roles.find((r: any) => 
        String(r.id) === String(roleCode) || 
        r.roleName === roleCode || 
        r.roleCode === roleCode ||
        r.roleTitle === roleCode
      );
      if (roleObj) {
        roleId = Number(roleObj.id);
      } else {
        const parsed = Number(roleCode.replace(/[^0-9]/g, ''));
        if (!isNaN(parsed) && parsed > 0) roleId = parsed;
      }
    } catch (e) {}

    const body: any = {};
    if (roleId) body.roleId = Number(roleId);
    if (branchId) {
      const parsedBranch = Number(String(branchId).replace(/[^0-9]/g, ''));
      if (!isNaN(parsedBranch) && parsedBranch > 0) {
        body.branchId = parsedBranch;
      }
    }

    await axiosClient.put(`/users/${userId}/role-branch`, body);
  },




  async deleteUser(id: string): Promise<void> {
    try {
      await axiosClient.put(`/users/${id}/status?status=TERMINATED`);
    } catch (e) {}
    await axiosClient.delete(`/users/${id}`);
  },
};
