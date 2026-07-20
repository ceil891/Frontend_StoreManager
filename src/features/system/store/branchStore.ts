import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface Branch {
  id: string;
  name: string;
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
  isLoading: boolean;
  error: string | null;

  fetchBranches: () => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id' | 'employeesCount' | 'currentRevenue'>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      isLoading: false,
      error: null,

      fetchBranches: async () => {
        set({ isLoading: true, error: null });
        try {
          // Lấy toàn bộ chi nhánh bao gồm cả chi nhánh đã bị xóa nếu includeDeleted=true
          const response = await axiosClient.get<any, any[]>('/branches?includeDeleted=false');
          const mapped = response.map((b: any) => ({
            id: String(b.id),
            branchCode: b.branchCode || `BR-${b.id}`,
            name: b.branchName || '',
            location: b.address || '',
            phone: b.phone || '',
            manager: b.manager?.fullName || b.manager?.username || '—',
            managerId: b.manager?.id ? String(b.manager.id) : undefined,
            employeesCount: 10, // Giả lập do DB chưa lưu thông số này
            status: (b.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
            revenueTarget: 300000000, // Giả lập
            currentRevenue: b.isActive ? 250000000 : 0, // Giả lập
            openedDate: b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          }));
          set({ branches: mapped, isLoading: false });
        } catch (err: any) {
          console.error('Failed to fetch branches:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách chi nhánh' });
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
