import { create } from 'zustand';
import { userService, normalizeSystemUser, branchLabel } from '../services/userService';
import { useAuthStore } from '@/features/auth/store/authStore';


export const BRANCH_OPTIONS: { id: string; label: string }[] = [];


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
  updateUserRoleAndBranch: (userId: string, roleCode: string, branchId: string) => Promise<void>;
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

  updateUserRoleAndBranch: async (userId: string, roleCode: string, branchId: string) => {
    set({ isLoading: true, error: null });
    try {
      await userService.updateRoleAndBranch(userId, roleCode, branchId);
      const data = await userService.fetchUsers();
      set({ users: data, isLoading: false });

      // Cập nhật session tức thì cho user đang đăng nhập nếu tự phân gán lại cho mình
      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser && String(currentAuthUser.id) === String(userId)) {
        const updatedSelf = data.find(u => String(u.id) === String(userId));
        if (updatedSelf) {
          useAuthStore.setState({
            user: {
              ...currentAuthUser,
              role: updatedSelf.assignedRole,
              branchId: updatedSelf.branchId,
              branchName: updatedSelf.branchLocation,
              branchLocation: updatedSelf.branchLocation,
              branchCode: updatedSelf.branchId === '1' ? 'CN-HCM' : 
                          updatedSelf.branchId === '2' ? 'CN-HN' : 
                          updatedSelf.branchId === '3' ? 'CN-DN' : 
                          updatedSelf.branchId === '4' ? 'CN-CT' : '',
            }
          });
          // Tải lại bộ mã quyền mới của vai trò được gắn mới
          await useAuthStore.getState().loadPermissions();
        }
      }
    } catch (err: any) {
      console.error('Failed to update role and branch:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật vai trò & chi nhánh' });
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
