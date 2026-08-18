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

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: '1',
    branchCode: 'CN-HCM',
    name: 'Chi nhánh Quận 1 (TP. Hồ Chí Minh)',
    location: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '028 3822 1234',
    manager: 'Lưu Hùng (Super Admin)',
    employeesCount: 15,
    status: 'ACTIVE',
    revenueTarget: 500000000,
    currentRevenue: 380000000,
    openedDate: '2023-01-15',
  },
  {
    id: '2',
    branchCode: 'CN-HN',
    name: 'Chi nhánh Hà Nội (Cầu Giấy)',
    location: '45 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    phone: '024 3766 5678',
    manager: 'Nguyễn Lưu Hngw',
    employeesCount: 12,
    status: 'ACTIVE',
    revenueTarget: 400000000,
    currentRevenue: 310000000,
    openedDate: '2023-03-20',
  },
  {
    id: '3',
    branchCode: 'CN-DN',
    name: 'Chi nhánh Đà Nẵng (Hải Châu)',
    location: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    phone: '0236 3899 999',
    manager: 'Trần Văn Bảo',
    employeesCount: 10,
    status: 'ACTIVE',
    revenueTarget: 300000000,
    currentRevenue: 240000000,
    openedDate: '2023-06-10',
  },
  {
    id: '4',
    branchCode: 'CN-CT',
    name: 'Chi nhánh Cần Thơ (Ninh Kiều)',
    location: '12 Đại lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    phone: '0292 3811 222',
    manager: 'Lê Hoàng Nam',
    employeesCount: 8,
    status: 'ACTIVE',
    revenueTarget: 250000000,
    currentRevenue: 190000000,
    openedDate: '2023-09-01',
  },
];

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: DEFAULT_BRANCHES,
      isLoading: false,
      error: null,

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

          if (rawList.length > 0) {
            const mapped: Branch[] = rawList.map((b: any) => ({
              id: String(b.id),
              branchCode: b.branchCode || `BR-${b.id}`,
              name: b.branchName || b.name || `Chi nhánh ${b.id}`,
              location: b.address || b.location || '',
              phone: b.phone || '',
              manager: b.manager?.fullName || b.manager?.username || b.manager || '—',
              managerId: b.manager?.id ? String(b.manager.id) : undefined,
              employeesCount: 10,
              status: (b.isActive === false ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
              revenueTarget: 300000000,
              currentRevenue: b.isActive !== false ? 250000000 : 0,
              openedDate: b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            }));
            set({ branches: mapped, isLoading: false });
          } else {
            set((state) => ({
              branches: state.branches.length > 0 ? state.branches : DEFAULT_BRANCHES,
              isLoading: false,
            }));
          }
        } catch (err: any) {
          console.warn('Failed to fetch branches, using current/defaults:', err);
          set((state) => ({
            branches: state.branches.length > 0 ? state.branches : DEFAULT_BRANCHES,
            isLoading: false,
            error: err.message || 'Lỗi khi tải danh sách chi nhánh',
          }));
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
