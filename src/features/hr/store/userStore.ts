import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  primaryDepartment: string;
  branchId: string;
  branchLocation: string;
  positionTitle: string;
  hireDate: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'SEASONAL';
  status: 'ACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED';
  lastLoginTimestamp: string;
  mfaEnabled: boolean;
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
    primaryDepartment: partial.primaryDepartment ?? 'Bộ phận Bán hàng',
    branchId,
    branchLocation: partial.branchLocation ?? branchLabel(branchId),
    positionTitle: partial.positionTitle ?? 'Nhân viên',
    hireDate: partial.hireDate ?? new Date().toISOString().split('T')[0],
    employmentType: partial.employmentType ?? 'FULL_TIME',
    status: partial.status ?? 'ACTIVE',
    lastLoginTimestamp: partial.lastLoginTimestamp ?? 'Chưa từng đăng nhập',
    mfaEnabled: partial.mfaEnabled ?? false,
    notes: partial.notes,
  };
}

const DEFAULT_MOCK_USERS: SystemUserRecord[] = [
  normalizeSystemUser({
    id: '1',
    authUserId: 'usr_001',
    userCode: 'USR-9901',
    fullName: 'Nguyễn Minh Quân',
    emailAddress: 'admin@system.com',
    contactPhone: '0901234567',
    avatarUrl: buildUserAvatarUrl('admin@system.com'),
    assignedRole: 'SUPER_ADMIN',
    primaryDepartment: 'Ban Giám đốc điều hành',
    branchId: 'HQ',
    branchLocation: 'Trụ sở chính - TP.HCM',
    positionTitle: 'Giám đốc điều hành',
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
    fullName: 'Trần Thị Lan',
    emailAddress: 'manager@store.com',
    contactPhone: '0912345678',
    avatarUrl: buildUserAvatarUrl('manager@store.com'),
    assignedRole: 'STORE_MANAGER',
    primaryDepartment: 'Quản lý vận hành cửa hàng',
    branchId: 'BR-001',
    branchLocation: 'CH Quận 1',
    positionTitle: 'Quản lý chi nhánh',
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
    primaryDepartment: 'Bộ phận Bán hàng & Chăm sóc khách hàng',
    branchId: 'BR-001',
    branchLocation: 'CH Quận 1',
    positionTitle: 'Nhân viên bán hàng / Thu ngân POS',
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
    fullName: 'Phạm Thu Hà',
    emailAddress: 'inventory@retailhub.vn',
    contactPhone: '0934567890',
    avatarUrl: buildUserAvatarUrl('inventory@retailhub.vn'),
    assignedRole: 'INVENTORY_STAFF',
    primaryDepartment: 'Bộ phận Kho vận & Kiểm soát tồn',
    branchId: 'BR-002',
    branchLocation: 'CH Tân Bình',
    positionTitle: 'Nhân viên kho',
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
  addUser: (user: SystemUserInput) => void;
  updateUser: (user: SystemUserRecord) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      users: DEFAULT_MOCK_USERS,
      addUser: (newUser) =>
        set((state) => {
          const id = `usr_${Date.now()}`;
          const branchId = newUser.branchId || 'BR-001';
          const created = normalizeSystemUser({
            ...newUser,
            id,
            authUserId: id,
            userCode: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
            branchId,
            branchLocation: newUser.branchLocation || branchLabel(branchId),
            lastLoginTimestamp: 'Chưa từng đăng nhập',
          });
          recordActivity({
            actionType: 'CREATE',
            moduleName: 'Nhân sự',
            pageName: 'Quản lý người dùng',
            entityType: 'SystemUser',
            entityId: created.id,
            entityLabel: `${created.fullName} (${created.userCode})`,
            description: `Thêm tài khoản ${created.emailAddress}, vai trò ${created.assignedRole}.`,
            userCode: created.userCode,
            changedFields: ['fullName', 'emailAddress', 'assignedRole', 'branchId'],
          });
          return { users: [...state.users, created] };
        }),
      updateUser: (updatedUser) =>
        set((state) => {
          const normalized = normalizeSystemUser(updatedUser);
          recordActivity({
            actionType: 'UPDATE',
            moduleName: 'Nhân sự',
            pageName: 'Quản lý người dùng',
            entityType: 'SystemUser',
            entityId: normalized.id,
            entityLabel: `${normalized.fullName} (${normalized.userCode})`,
            description: `Cập nhật hồ sơ nhân viên ${normalized.emailAddress}.`,
            userCode: normalized.userCode,
            changedFields: ['fullName', 'emailAddress', 'assignedRole', 'status', 'branchId'],
          });
          return {
            users: state.users.map((u) => (u.id === updatedUser.id ? normalized : u)),
          };
        }),
      deleteUser: (id) =>
        set((state) => {
          const removed = state.users.find((u) => u.id === id);
          if (removed) {
            recordActivity({
              actionType: 'DELETE',
              moduleName: 'Nhân sự',
              pageName: 'Quản lý người dùng',
              entityType: 'SystemUser',
              entityId: removed.id,
              entityLabel: `${removed.fullName} (${removed.userCode})`,
              description: `Xóa tài khoản ${removed.emailAddress}.`,
              userCode: removed.userCode,
            });
          }
          return { users: state.users.filter((u) => u.id !== id) };
        }),
    }),
    {
      name: 'retailhub-users',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<UserStore> | undefined;
        const users = mergeUsersWithDefaults(p?.users ?? current.users);
        return { ...current, ...p, users };
      },
    }
  )
);
