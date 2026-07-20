import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import { recordActivity } from '@/shared/utils/activityLogger';

export const BRANCH_OPTIONS = [
  { id: 'HQ', label: 'Trụ sở chính - TP.HCM' },
  { id: 'BR-001', label: 'CH Quận 1' },
  { id: 'BR-002', label: 'CH Tân Bình' },
  { id: 'BR-003', label: 'CH Gò Vấp' },
  { id: 'BR-004', label: 'CH Quận 7' },
  { id: 'BR-005', label: 'CH Bình Dương' },
] as const;

export interface SystemUserRecord {
  id: string;
  /** Liên kết tài khoản đăng nhập (auth). */
  authUserId: string;
  userCode: string;
  fullName: string;
  emailAddress: string;
  contactPhone: string;
  /** Ảnh đại diện — bắt buộc (URL). */
  avatarUrl: string;
  assignedRole: string;
  departmentId: string;
  branchId: string;
  branchLocation: string;
  positionId: string;
  managerId?: string;
  timezone?: string;
  locale?: string;
  identityId?: string;
  taxId?: string;
  dateOfBirth?: string;
  hireDate: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'SEASONAL';
  status: 'ACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED';
  lastLoginTimestamp: string;
  mfaEnabled: boolean;
  faceEnrolled?: boolean;
  notes?: string;
}

export type SystemUserInput = Omit<SystemUserRecord, 'id' | 'userCode' | 'lastLoginTimestamp' | 'authUserId'>;

function branchLabel(branchId: string): string {
  return BRANCH_OPTIONS.find((b) => b.id === branchId)?.label ?? branchId;
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

const DEFAULT_MOCK_USERS: SystemUserRecord[] = [
  normalizeSystemUser({
    id: '1',
    authUserId: 'usr_001',
    userCode: 'USR-9901',
    fullName: 'Nguyễn minh quân',
    emailAddress: 'admin@system.com',
    contactPhone: '0901234567',
    avatarUrl: buildUserAvatarUrl('admin@system.com'),
    assignedRole: 'SUPER_ADMIN',
    departmentId: '1',
    branchId: 'HQ',
    branchLocation: 'Trụ sở chính - TP.HCM',
    positionId: '1',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    hireDate: '2019-01-15',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    lastLoginTimestamp: '2024-05-18 06:15:00',
    mfaEnabled: true,
    notes: 'Quản trị viên tối cao hệ thống RetailHub.',
  }),
  normalizeSystemUser({
    id: '2',
    authUserId: 'usr_002',
    userCode: 'USR-8821',
    fullName: 'Trần thị Lan',
    emailAddress: 'manager@store.com',
    contactPhone: '0912345678',
    avatarUrl: buildUserAvatarUrl('manager@store.com'),
    assignedRole: 'STORE_MANAGER',
    departmentId: '1',
    branchId: 'BR-001',
    branchLocation: 'CH Quận 1',
    positionId: '1',
    managerId: '1',
    hireDate: '2021-03-01',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    lastLoginTimestamp: '2024-05-18 06:22:15',
    mfaEnabled: true,
    notes: 'Phê duyệt nhập xuất kho và điều phối ca POS.',
  }),
  normalizeSystemUser({
    id: '3',
    authUserId: 'usr_003',
    userCode: 'USR-4412',
    fullName: 'Lê Hoàng Nam',
    emailAddress: 'staff@store.com',
    contactPhone: '0923456789',
    avatarUrl: buildUserAvatarUrl('staff@store.com'),
    assignedRole: 'STAFF',
    departmentId: '1',
    branchId: 'BR-001',
    branchLocation: 'CH Quận 1',
    positionId: '1',
    managerId: '2',
    hireDate: '2022-08-10',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    lastLoginTimestamp: '2024-05-18 05:40:10',
    mfaEnabled: true,
    notes: 'Vận hành quầy POS và chốt ca cuối ngày.',
  }),
  normalizeSystemUser({
    id: '4',
    authUserId: 'usr_004',
    userCode: 'USR-1109',
    fullName: 'Phạm thu Hà',
    emailAddress: 'inventory@retailhub.vn',
    contactPhone: '0934567890',
    avatarUrl: buildUserAvatarUrl('inventory@retailhub.vn'),
    assignedRole: 'INVENTORY_STAFF',
    departmentId: '2',
    branchId: 'BR-002',
    branchLocation: 'CH Tân Bình',
    positionId: '2',
    managerId: '2',
    hireDate: '2023-02-20',
    employmentType: 'FULL_TIME',
    status: 'ON_LEAVE',
    lastLoginTimestamp: '2024-04-30 18:00:00',
    mfaEnabled: true,
    notes: 'Đang nghỉ phép dưỡng thai, dự kiến quay lại quý 3.',
  }),
];

function mergeUsersWithDefaults(users: SystemUserRecord[]): SystemUserRecord[] {
  const defaultByEmail = new Map(
    DEFAULT_MOCK_USERS.map((u) => [u.emailAddress.toLowerCase(), u])
  );
  const seen = new Set<string>();
  const merged = users.map((raw) => {
    const def = defaultByEmail.get(raw.emailAddress.toLowerCase());
    seen.add(raw.emailAddress.toLowerCase());
    return normalizeSystemUser({ ...def, ...raw, id: raw.id });
  });
  for (const def of DEFAULT_MOCK_USERS) {
    if (!seen.has(def.emailAddress.toLowerCase())) {
      merged.push(def);
    }
  }
  return merged;
}

interface UserStore {
  users: SystemUserRecord[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: SystemUserInput) => Promise<void>;
  updateUser: (user: SystemUserRecord) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosClient.get<any, any[]>('/users?includeDeleted=false');
          // Lấy danh sách roles trong DB để map roleId -> roleName
          let roles: any[] = [];
          try {
            roles = await axiosClient.get<any, any[]>('/roles');
          } catch (roleErr) {
            console.warn('Failed to fetch roles, using fallback mapping:', roleErr);
          }
          const mapped = response.map((u: any) => {
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
              departmentId: '1', // Mặc định
              branchId: u.branch?.id ? String(u.branch.id) : 'BR-001',
              branchLocation: u.branch?.branchName || 'CH Quận 1',
              positionId: '1', // Mặc định
              managerId: undefined,
              hireDate: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              employmentType: 'FULL_TIME',
              status: u.status || 'ACTIVE',
              lastLoginTimestamp: 'Chưa từng đăng nhập',
              mfaEnabled: false,
              faceEnrolled: false,
            });
          });
          set({ users: mapped, isLoading: false });
        } catch (err: any) {
          console.error('Failed to fetch users:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách nhân viên' });
        }
      },

      addUser: async (newUser) => {
        set({ isLoading: true, error: null });
        try {
          // Lấy danh sách roles để map roleName -> roleId
          const roles = await axiosClient.get<any, any[]>('/roles');
          const roleObj = roles.find((r: any) => r.roleName === newUser.assignedRole);
          const roleId = roleObj ? roleObj.id : 4; // Mặc định là STAFF (nếu database có seeder STAFF id 4)

          const payload = {
            username: newUser.emailAddress.split('@')[0], // dùng phần trước email làm username
            password: 'User@123', // Mật khẩu mặc định khi tạo mới nhân viên
            fullName: newUser.fullName,
            email: newUser.emailAddress,
            phone: newUser.contactPhone,
            roleId: Number(roleId),
            branchId: newUser.branchId ? Number(newUser.branchId) : 1,
            status: newUser.status || 'ACTIVE',
          };
          await axiosClient.post('/users', payload);
          await get().fetchUsers();
        } catch (err: any) {
          console.error('Failed to add user:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi thêm người dùng mới' });
          throw err;
        }
      },

      updateUser: async (updatedUser) => {
        set({ isLoading: true, error: null });
        try {
          const userId = updatedUser.id;
          // Lấy danh sách roles để map roleName -> roleId
          const roles = await axiosClient.get<any, any[]>('/roles');
          const roleObj = roles.find((r: any) => r.roleName === updatedUser.assignedRole);
          const roleId = roleObj ? roleObj.id : 4;

          const payload = {
            fullName: updatedUser.fullName,
            email: updatedUser.emailAddress,
            phone: updatedUser.contactPhone,
            roleId: Number(roleId),
            branchId: updatedUser.branchId ? Number(updatedUser.branchId) : 1,
          };
          await axiosClient.put(`/users/${userId}`, payload);

          // Cập nhật status bằng API status nếu khác nhau
          const original = get().users.find((u) => u.id === userId);
          if (original && original.status !== updatedUser.status) {
            await axiosClient.put(`/users/${userId}/status?status=${updatedUser.status}`);
          }

          await get().fetchUsers();
        } catch (err: any) {
          console.error('Failed to update user:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật người dùng' });
          throw err;
        }
      },

      deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Trước tiên chuyển status = TERMINATED
          await axiosClient.put(`/users/${id}/status?status=TERMINATED`);
          await axiosClient.delete(`/users/${id}`);
          await get().fetchUsers();
        } catch (err: any) {
          console.error('Failed to delete user:', err);
          const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa người dùng';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },
    }),
    {
      name: 'retailhub-users',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
