import { create } from 'zustand';
import { userService, normalizeSystemUser, branchLabel } from '../services/userService';

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
  authUserId: string;
  userCode: string;
  fullName: string;
  emailAddress: string;
  contactPhone: string;
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

export { normalizeSystemUser, branchLabel };

interface UserStore {
  users: SystemUserRecord[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: SystemUserInput) => Promise<void>;
  updateUser: (user: SystemUserRecord) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await userService.fetchUsers();
      set({ users: data, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách nhân viên' });
    }
  },

  addUser: async (newUser) => {
    set({ isLoading: true, error: null });
    try {
      const created = await userService.addUser(newUser);
      set((state) => ({ users: [created, ...state.users], isLoading: false }));
    } catch (err: any) {
      console.error('Failed to add user:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi thêm người dùng mới' });
      throw err;
    }
  },

  updateUser: async (updatedUser) => {
    set({ isLoading: true, error: null });
    try {
      const result = await userService.updateUser(updatedUser);
      set((state) => ({
        users: state.users.map((u) => (u.id === updatedUser.id ? result : u)),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to update user:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật người dùng' });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
    }
  },
}));
