import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface Branch {
  id: string;
  name: string;
  branchName?: string;
  location: string;
  phone: string;
  manager: string;
  managerId?: string;
  employeesCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  revenueTarget: number;
  currentRevenue: number;
  openedDate: string;
  branchCode: string;
}

interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;

  fetchBranches: () => Promise<void>;
  setCurrentBranch: (branch: Branch | null) => void;
  addBranch: (branch: Omit<Branch, 'id' | 'employeesCount' | 'currentRevenue'>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
}

export const DEFAULT_BRANCHES: Branch[] = [];

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      currentBranch: null,
      isLoading: false,
      error: null,

      setCurrentBranch: (branch) => set({ currentBranch: branch }),

      fetchBranches: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, any>('/branches?includeDeleted=false');
          const rawList: any[] = Array.isArray(res)
            ? res
            : (Array.isArray(res?.data)
              ? res.data
              : (Array.isArray(res?.content)
                ? res.content
                : (Array.isArray(res?.data?.content)
                  ? res.data.content
                  : [])));

          const mapped: Branch[] = rawList.map((b: any) => {
            const bName = b.branchName || b.name || `Chi nhánh ${b.id}`;
            return {
              id: String(b.id),
              branchCode: b.branchCode || `BR-${b.id}`,
              name: bName,
              branchName: bName,
              location: b.address || b.location || '',
              phone: b.phone || '',
              manager: b.manager?.fullName || b.manager?.username || b.manager || '—',
              managerId: b.manager?.id ? String(b.manager.id) : (b.managerId ? String(b.managerId) : undefined),
              employeesCount: Number(b.employeesCount || 0),
              status: (b.isActive === false ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
              revenueTarget: Number(b.revenueTarget || 0),
              currentRevenue: Number(b.currentRevenue || 0),
              openedDate: b.createdAt ? b.createdAt.split('T')[0] : (b.openedDate || new Date().toISOString().split('T')[0]),
            };
          });
          set((state) => ({ branches: mapped, currentBranch: state.currentBranch || mapped[0] || null, isLoading: false }));
        } catch (err: any) {
          console.warn('Failed to fetch branches:', err);
          set({
            branches: [],
            isLoading: false,
            error: err.message || 'Lỗi khi tải danh sách chi nhánh',
          });
        }
      },

      addBranch: async (branch) => {
        set({ isLoading: true, error: null });
        try {
          const payload = {
            branchCode: branch.branchCode || `BR-${Date.now().toString().slice(-4)}`,
            branchName: branch.name,
            address: branch.location,
            phone: branch.phone,
            isActive: branch.status === 'ACTIVE',
            managerId: branch.managerId ? Number(branch.managerId) : null,
          };
          await axiosClient.post('/branches', payload);
          await get().fetchBranches();
        } catch (err: any) {
          console.error('Failed to add branch:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tạo chi nhánh mới' });
          throw err;
        }
      },

      updateBranch: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const original = get().branches.find((b) => b.id === id);
          const payload = {
            branchCode: data.branchCode || original?.branchCode,
            branchName: data.name || original?.name,
            address: data.location || original?.location,
            phone: data.phone || original?.phone,
            isActive: data.status !== undefined ? (data.status === 'ACTIVE') : (original?.status === 'ACTIVE'),
            managerId: data.managerId !== undefined ? (data.managerId ? Number(data.managerId) : null) : (original?.managerId ? Number(original.managerId) : null),
          };
          await axiosClient.put(`/branches/${id}`, payload);
          
          // Nếu status thay đổi, gọi thêm API status
          if (data.status !== undefined && original && (data.status === 'ACTIVE') !== (original.status === 'ACTIVE')) {
            await axiosClient.put(`/branches/${id}/status?isActive=${data.status === 'ACTIVE'}`);
          }

          await get().fetchBranches();
        } catch (err: any) {
          console.error('Failed to update branch:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật chi nhánh' });
          throw err;
        }
      },

      deleteBranch: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Trước khi delete cần chuyển trạng thái isActive = false
          await axiosClient.put(`/branches/${id}/status?isActive=false`);
          await axiosClient.delete(`/branches/${id}`);
          await get().fetchBranches();
        } catch (err: any) {
          console.error('Failed to delete branch:', err);
          const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa chi nhánh';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },
    }),
    {
      name: 'retailhub-branches-storage',
    }
  )
);
