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
  departmentId?: string;
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

export interface EmployeeContractRecord {
  id: string;
  contractCode: string;
  employeeName: string;
  employeePhone: string;
  contractType: 'PROBATION' | 'DEFINITE' | 'INDEFINITE';
  baseSalary: number;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  notes?: string;
}

export interface KpiRecord {
  id: string;
  employeeName: string;
  departmentName: string;
  kpiMonth: string;
  targetScore: number;
  achievedScore: number;
  ratingGrade: 'A_EXCELLENT' | 'B_GOOD' | 'C_AVERAGE' | 'D_POOR';
  bonusAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface LeaveRequestRecord {
  id: string;
  requestCode: string;
  employeeName: string;
  leaveType: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'UNPAID';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
}

export interface ShiftSwapRequestRecord {
  id: string;
  requestCode: string;
  requesterName: string;
  requesterShift: string;
  targetUserName: string;
  targetUserShift: string;
  swapDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  payrollCode: string;
  employeeName: string;
  payrollMonth: string;
  baseSalary: number;
  allowances: number;
  kpiBonus: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paymentDate?: string;
}

interface HrState {
  departments: DepartmentRecord[];
  positions: JobPositionRecord[];
  contracts: EmployeeContractRecord[];
  kpiRecords: KpiRecord[];
  leaveRequests: LeaveRequestRecord[];
  shiftSwapRequests: ShiftSwapRequestRecord[];
  payrolls: PayrollRecord[];
  isLoading: boolean;
  error: string | null;

  fetchDepartments: () => Promise<void>;
  addDepartment: (dept: Omit<DepartmentRecord, 'id' | 'totalEmployees' | 'ytdSpendUsd'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<DepartmentRecord>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  fetchPositions: () => Promise<void>;
  addPosition: (pos: Omit<JobPositionRecord, 'id'>) => Promise<void>;
  updatePosition: (id: string, data: Partial<JobPositionRecord>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;

  fetchContracts: () => Promise<void>;
  addContract: (item: Omit<EmployeeContractRecord, 'id'>) => Promise<void>;
  updateContract: (id: string, data: Partial<EmployeeContractRecord>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  fetchKpiRecords: () => Promise<void>;
  addKpiRecord: (item: Omit<KpiRecord, 'id'>) => Promise<void>;
  updateKpiRecord: (id: string, data: Partial<KpiRecord>) => Promise<void>;
  deleteKpiRecord: (id: string) => Promise<void>;

  fetchLeaveRequests: () => Promise<void>;
  addLeaveRequest: (item: Omit<LeaveRequestRecord, 'id'>) => Promise<void>;
  updateLeaveRequest: (id: string, data: Partial<LeaveRequestRecord>) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;

  fetchShiftSwapRequests: () => Promise<void>;
  addShiftSwapRequest: (item: Omit<ShiftSwapRequestRecord, 'id'>) => Promise<void>;
  updateShiftSwapRequest: (id: string, data: Partial<ShiftSwapRequestRecord>) => Promise<void>;
  deleteShiftSwapRequest: (id: string) => Promise<void>;

  fetchPayrolls: () => Promise<void>;
  addPayroll: (item: Omit<PayrollRecord, 'id'>) => Promise<void>;
  updatePayroll: (id: string, data: Partial<PayrollRecord>) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;
}

export const useHrStore = create<HrState>()(
  persist(
    (set, get) => ({
      departments: [],
      positions: [],
      contracts: [],
      kpiRecords: [],
      leaveRequests: [],
      shiftSwapRequests: [],
      payrolls: [],
      isLoading: false,
      error: null,

      fetchDepartments: async () => {
        set({ isLoading: true, error: null });
        try {
          let list: any[] = [];
          try {
            const res = await axiosClient.get<any, any>('/hr/departments');
            list = Array.isArray(res) ? res : (res?.data || res?.content || res || []);
          } catch {
            // ignore network error
          }

          const mapped = list.map((d: any) => ({
            id: String(d.id),
            departmentCode: d.deptCode || d.departmentCode || `DPT-${d.id}`,
            departmentName: d.deptName || d.departmentName || '',
            description: d.description || '',
            status: (d.isActive !== false && !d.isDeleted ? 'ACTIVE' : 'INACTIVE') as any,
            totalEmployees: Number(d.totalEmployees || 0),
            allocatedAnnualBudgetUsd: Number(d.allocatedAnnualBudgetUsd || d.budget || 0),
            ytdSpendUsd: Number(d.ytdSpendUsd || d.spend || 0),
            costCenterCode: d.costCenterCode || (d.deptCode ? `CC-${d.deptCode.replace('DPT-', '')}` : ''),
            establishedDate: d.createdAt ? d.createdAt.split('T')[0] : (d.establishedDate || new Date().toISOString().split('T')[0]),
          }));
          set({ departments: mapped, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addDepartment: async (dept) => {
        try {
          await axiosClient.post('/hr/departments', {
            deptCode: dept.departmentCode,
            deptName: dept.departmentName,
            description: dept.description,
          });
          await get().fetchDepartments();
        } catch {
          await get().fetchDepartments();
        }
      },
      updateDepartment: async (id, data) => {
        try {
          await axiosClient.put(`/hr/departments/${id}`, {
            deptCode: data.departmentCode,
            deptName: data.departmentName,
            description: data.description,
          });
          await get().fetchDepartments();
        } catch {
          await get().fetchDepartments();
        }
      },
      deleteDepartment: async (id) => {
        try {
          await axiosClient.delete(`/hr/departments/${id}`);
          await get().fetchDepartments();
        } catch {
          await get().fetchDepartments();
        }
      },

      fetchPositions: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, any>('/hr/positions');
          const list: any[] = Array.isArray(res) ? res : (res?.data || res?.content || res || []);
          const mapped = list.map((p: any) => ({
            id: String(p.id),
            positionCode: p.positionCode || `POS-${p.id}`,
            positionTitle: p.positionTitle || p.positionName || '',
            departmentId: p.departmentId ? String(p.departmentId) : undefined,
            departmentName: p.departmentName || 'Chưa phân bổ',
            jobGradeTier: p.jobGradeTier || 'ASSOCIATE_L2',
            salaryRangeMin: Number(p.salaryRangeMin || (p.baseSalary ? Number(p.baseSalary) * 0.85 : 10000000)),
            salaryRangeMax: Number(p.salaryRangeMax || (p.baseSalary ? Number(p.baseSalary) * 1.25 : 25000000)),
            activeHeadcount: Number(p.activeHeadcount || 0),
            approvedHeadcountQuota: Number(p.approvedHeadcountQuota || 1),
            isOvertimeEligible: p.isOvertimeEligible !== undefined ? Boolean(p.isOvertimeEligible) : true,
            status: p.status || 'OPEN_HIRING',
            lastReviewedDate: p.lastReviewedDate || new Date().toISOString().split('T')[0],
            qualificationRequirement: p.qualificationRequirement || ''
          }));
          set({ positions: mapped, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addPosition: async (pos) => {
        try {
          await axiosClient.post('/hr/positions', {
            positionCode: pos.positionCode,
            positionName: pos.positionTitle,
            positionTitle: pos.positionTitle,
            departmentId: pos.departmentId ? Number(pos.departmentId) : undefined,
            baseSalary: pos.salaryRangeMin || 0,
          });
          await get().fetchPositions();
        } catch {
          await get().fetchPositions();
        }
      },
      updatePosition: async (id, data) => {
        try {
          await axiosClient.put(`/hr/positions/${id}`, {
            positionCode: data.positionCode,
            positionName: data.positionTitle,
            positionTitle: data.positionTitle,
            departmentId: data.departmentId ? Number(data.departmentId) : undefined,
            baseSalary: data.salaryRangeMin || 0,
          });
          await get().fetchPositions();
        } catch {
          await get().fetchPositions();
        }
      },
      deletePosition: async (id) => {
        try {
          await axiosClient.delete(`/hr/positions/${id}`);
          await get().fetchPositions();
        } catch {
          await get().fetchPositions();
        }
      },

      fetchContracts: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, EmployeeContractRecord[]>('/hr/contracts');
          set({ contracts: res, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addContract: async (item) => {
        await axiosClient.post('/hr/contracts', item);
        await get().fetchContracts();
      },
      updateContract: async (id, data) => {
        await axiosClient.put(`/hr/contracts/${id}`, data);
        await get().fetchContracts();
      },
      deleteContract: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(`/hr/contracts/${id}`);
          await get().fetchContracts();
        } catch (e: any) {
          console.error('Failed to delete contract:', e);
          set({ isLoading: false, error: e?.message || 'Lỗi khi xóa hợp đồng' });
          throw e;
        }
      },

      fetchKpiRecords: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, KpiRecord[]>('/hr/kpis');
          set({ kpiRecords: res, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addKpiRecord: async (item) => {
        await axiosClient.post('/hr/kpis', item);
        await get().fetchKpiRecords();
      },
      updateKpiRecord: async (id, data) => {
        await axiosClient.put(`/hr/kpis/${id}`, data);
        await get().fetchKpiRecords();
      },
      deleteKpiRecord: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(`/hr/kpis/${id}`);
          await get().fetchKpiRecords();
        } catch (e: any) {
          console.error('Failed to delete KPI record:', e);
          set({ isLoading: false, error: e?.message || 'Lỗi khi xóa KPI' });
          throw e;
        }
      },

      fetchLeaveRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, LeaveRequestRecord[]>('/hr/leave-requests');
          set({ leaveRequests: res, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addLeaveRequest: async (item) => {
        await axiosClient.post('/hr/leave-requests', item);
        await get().fetchLeaveRequests();
      },
      updateLeaveRequest: async (id, data) => {
        await axiosClient.put(`/hr/leave-requests/${id}`, data);
        await get().fetchLeaveRequests();
      },
      deleteLeaveRequest: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(`/hr/leave-requests/${id}`);
          await get().fetchLeaveRequests();
        } catch (e: any) {
          console.error('Failed to delete leave request:', e);
          set({ isLoading: false, error: e?.message || 'Lỗi khi xóa đơn nghỉ phép' });
          throw e;
        }
      },

      fetchShiftSwapRequests: async () => {
        try {
          const res = await axiosClient.get<any, any>('/hr/shift-swaps');
          const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
          set({ shiftSwapRequests: list });
        } catch (error) {
          console.error('Failed to fetch shift swap requests:', error);
        }
      },
      addShiftSwapRequest: async (item) => {
        await axiosClient.post('/hr/shift-swaps', item);
        await get().fetchShiftSwapRequests();
      },
      updateShiftSwapRequest: async (id, data) => {
        await axiosClient.put(`/hr/shift-swaps/${id}`, data);
        await get().fetchShiftSwapRequests();
      },
      deleteShiftSwapRequest: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(`/hr/shift-swaps/${id}`);
          await get().fetchShiftSwapRequests();
        } catch (e: any) {
          console.error('Failed to delete shift swap request:', e);
          set({ isLoading: false, error: e?.message || 'Lỗi khi xóa yêu cầu đổi ca' });
          throw e;
        }
      },

      fetchPayrolls: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosClient.get<any, any>('/finance/payrolls');
          const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
          set({ payrolls: list, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      addPayroll: async (item) => {
        await axiosClient.post('/finance/payrolls', item);
        await get().fetchPayrolls();
      },
      updatePayroll: async (id, data) => {
        await axiosClient.put(`/finance/payrolls/${id}`, data);
        await get().fetchPayrolls();
      },
      deletePayroll: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axiosClient.delete(`/finance/payrolls/${id}`);
          await get().fetchPayrolls();
        } catch (e: any) {
          console.error('Failed to delete payroll:', e);
          set({ isLoading: false, error: e?.message || 'Lỗi khi xóa bảng lương' });
          throw e;
        }
      },
    }),
    {
      name: 'retailhub-hr-storage',
    }
  )
);
