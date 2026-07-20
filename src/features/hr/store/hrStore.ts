import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface DepartmentRecord {
  id: string;
  departmentCode: string;
  departmentName: string;
  headUserId?: string;
  totalEmployees?: number;
  allocatedAnnualBudgetUsd?: number;
  ytdSpendUsd?: number;
  costCenterCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'RESTRUCTURING' | 'MERGING';
  establishedDate?: string;
  parentId?: string;
  missionStatement?: string;
  locationId?: string;
  description?: string;
}

export interface JobPositionRecord {
  id: string;
  positionCode: string;
  positionTitle: string;
  departmentName: string;
  jobGradeTier: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  activeHeadcount: number;
  approvedHeadcountQuota: number;
  isOvertimeEligible: boolean;
  status: 'OPEN_HIRING' | 'FULL_QUOTA' | 'FROZEN_BUDGET' | 'DEPRECATED';
  lastReviewedDate?: string;
  qualificationRequirement?: string;
}

interface HrState {
  departments: DepartmentRecord[];
  positions: JobPositionRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchDepartments: () => Promise<void>;
  addDepartment: (dept: Omit<DepartmentRecord, 'id' | 'totalEmployees' | 'ytdSpendUsd'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<DepartmentRecord>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  // Position Actions (Mock for now)
  addPosition: (pos: Omit<JobPositionRecord, 'id'>) => void;
  updatePosition: (id: string, data: Partial<JobPositionRecord>) => void;
  deletePosition: (id: string) => void;
}

const MOCK_POSITIONS: JobPositionRecord[] = [
  { id: '1', positionCode: 'POS-RTL-L3', positionTitle: 'Omnichannel Retail Store Supervisor', departmentName: 'Omnichannel Retail & Store Operations', jobGradeTier: 'TEAM_LEAD_L3', salaryRangeMin: 65000, salaryRangeMax: 88000, activeHeadcount: 42, approvedHeadcountQuota: 50, isOvertimeEligible: true, status: 'OPEN_HIRING', lastReviewedDate: '2024-03-15', qualificationRequirement: '3+ years supervisory experience.' },
  { id: '2', positionCode: 'POS-LOG-L4', positionTitle: 'Regional Warehouse Manager', departmentName: 'Supply Chain & Regional Warehousing', jobGradeTier: 'SENIOR_MGR_L4', salaryRangeMin: 95000, salaryRangeMax: 130000, activeHeadcount: 8, approvedHeadcountQuota: 8, isOvertimeEligible: false, status: 'FULL_QUOTA', lastReviewedDate: '2024-01-20' },
];

export const useHrStore = create<HrState>()(
  persist(
    (set, get) => ({
      departments: [],
      positions: MOCK_POSITIONS,
      isLoading: false,
      error: null,

      fetchDepartments: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, any[]>('/departments?includeDeleted=false');
          const mapped = res.map((d: any) => ({
            id: String(d.id),
            departmentCode: d.deptCode || '',
            departmentName: d.deptName || '',
            description: d.description || '',
            status: (d.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'RESTRUCTURING' | 'MERGING',
            totalEmployees: 10, // Mock
            allocatedAnnualBudgetUsd: 100000, // Mock
            ytdSpendUsd: 45000, // Mock
            costCenterCode: 'CC-GEN',
            establishedDate: d.createdAt ? d.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          }));
          set({ departments: mapped, isLoading: false });
        } catch (err: any) {
          console.error('Failed to fetch departments:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách ngành hàng' });
        }
      },

      addDepartment: async (dept) => {
        set({ isLoading: true, error: null });
        try {
          const payload = {
            deptCode: dept.departmentCode,
            deptName: dept.departmentName,
            description: dept.description || '',
            isActive: dept.status === 'ACTIVE',
          };
          await axiosClient.post('/departments', payload);
          await get().fetchDepartments();
        } catch (err: any) {
          console.error('Failed to add department:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi tạo ngành hàng mới' });
          throw err;
        }
      },

      updateDepartment: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const original = get().departments.find((d) => d.id === id);
          const payload = {
            deptCode: data.departmentCode || original?.departmentCode,
            deptName: data.departmentName || original?.departmentName,
            description: data.description !== undefined ? data.description : original?.description,
          };
          await axiosClient.put(`/departments/${id}`, payload);

          // Cập nhật status
          if (data.status !== undefined && original && (data.status === 'ACTIVE') !== (original.status === 'ACTIVE')) {
            await axiosClient.put(`/departments/${id}/status?isActive=${data.status === 'ACTIVE'}`);
          }

          await get().fetchDepartments();
        } catch (err: any) {
          console.error('Failed to update department:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật ngành hàng' });
          throw err;
        }
      },

      deleteDepartment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Tắt hoạt động trước khi xóa
          await axiosClient.put(`/departments/${id}/status?isActive=false`);
          await axiosClient.delete(`/departments/${id}`);
          await get().fetchDepartments();
        } catch (err: any) {
          console.error('Failed to delete department:', err);
          set({ isLoading: false, error: err.message || 'Lỗi khi xóa ngành hàng' });
          throw err;
        }
      },

      // Position Actions (Mock)
      addPosition: (pos) => set((state) => ({ positions: [{ id: Date.now().toString(), ...pos }, ...state.positions] })),
      updatePosition: (id, data) => set((state) => ({ positions: state.positions.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deletePosition: (id) => set((state) => ({ positions: state.positions.filter((p) => p.id !== id) })),
    }),
    {
      name: 'retailhub-hr-storage',
    }
  )
);
