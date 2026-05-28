import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------
// TYPES: DEPARTMENTS & POSITIONS
// ---------------------------
export interface DepartmentRecord {
  id: string;
  departmentCode: string;
  departmentName: string;
  headOfDepartment: string;
  totalEmployees: number;
  allocatedAnnualBudgetUsd: number;
  ytdSpendUsd: number;
  costCenterCode: string;
  status: 'ACTIVE' | 'MERGING' | 'RESTRUCTURING' | 'INACTIVE';
  establishedDate: string;
  parentDivision: string;
  missionStatement?: string;
}

export interface JobPositionRecord {
  id: string;
  positionCode: string;
  positionTitle: string;
  departmentName: string;
  jobGradeTier: 'EXECUTIVE_L6' | 'DIRECTOR_L5' | 'SENIOR_MGR_L4' | 'TEAM_LEAD_L3' | 'ASSOCIATE_L2' | 'ENTRY_L1';
  salaryRangeMin: number;
  salaryRangeMax: number;
  activeHeadcount: number;
  approvedHeadcountQuota: number;
  isOvertimeEligible: boolean;
  status: 'OPEN_HIRING' | 'FULL_QUOTA' | 'FROZEN' | 'PHASING_OUT';
  lastReviewedDate: string;
  qualificationRequirement?: string;
}

// ---------------------------
// STATE INTERFACE
// ---------------------------
interface HrState {
  departments: DepartmentRecord[];
  positions: JobPositionRecord[];
  
  // Department Actions
  addDepartment: (dept: Omit<DepartmentRecord, 'id'>) => void;
  updateDepartment: (id: string, data: Partial<DepartmentRecord>) => void;
  deleteDepartment: (id: string) => void;

  // Position Actions
  addPosition: (pos: Omit<JobPositionRecord, 'id'>) => void;
  updatePosition: (id: string, data: Partial<JobPositionRecord>) => void;
  deletePosition: (id: string) => void;
}

// ---------------------------
// MOCK DATA SEED
// ---------------------------
const MOCK_DEPARTMENTS: DepartmentRecord[] = [
  { id: '1', departmentCode: 'DPT-SLS-01', departmentName: 'Omnichannel Retail & Store Operations', headOfDepartment: 'VP Marcus Aurelius', totalEmployees: 480, allocatedAnnualBudgetUsd: 4500000.00, ytdSpendUsd: 1850400.00, costCenterCode: 'CC-SALES-101', status: 'ACTIVE', establishedDate: '2018-01-15', parentDivision: 'Global Commercial Operations', missionStatement: 'Maximizing retail gross margin performance across brick-and-mortar storefronts.' },
  { id: '2', departmentCode: 'DPT-LOG-02', departmentName: 'Supply Chain & Regional Warehousing', headOfDepartment: 'Director Sarah Jenkins', totalEmployees: 185, allocatedAnnualBudgetUsd: 2800000.00, ytdSpendUsd: 1120000.00, costCenterCode: 'CC-LOG-202', status: 'ACTIVE', establishedDate: '2019-06-01', parentDivision: 'Logistics & Distribution' },
];

const MOCK_POSITIONS: JobPositionRecord[] = [
  { id: '1', positionCode: 'POS-RTL-L3', positionTitle: 'Omnichannel Retail Store Supervisor', departmentName: 'Omnichannel Retail & Store Operations', jobGradeTier: 'TEAM_LEAD_L3', salaryRangeMin: 65000, salaryRangeMax: 88000, activeHeadcount: 42, approvedHeadcountQuota: 50, isOvertimeEligible: true, status: 'OPEN_HIRING', lastReviewedDate: '2024-03-15', qualificationRequirement: '3+ years supervisory experience.' },
  { id: '2', positionCode: 'POS-LOG-L4', positionTitle: 'Regional Warehouse Manager', departmentName: 'Supply Chain & Regional Warehousing', jobGradeTier: 'SENIOR_MGR_L4', salaryRangeMin: 95000, salaryRangeMax: 130000, activeHeadcount: 8, approvedHeadcountQuota: 8, isOvertimeEligible: false, status: 'FULL_QUOTA', lastReviewedDate: '2024-01-20' },
];

export const useHrStore = create<HrState>()(
  persist(
    (set) => ({
      departments: MOCK_DEPARTMENTS,
      positions: MOCK_POSITIONS,

      // Department Actions
      addDepartment: (dept) => set((state) => ({ departments: [{ id: Date.now().toString(), ...dept }, ...state.departments] })),
      updateDepartment: (id, data) => set((state) => ({ departments: state.departments.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
      deleteDepartment: (id) => set((state) => ({ departments: state.departments.filter((d) => d.id !== id) })),

      // Position Actions
      addPosition: (pos) => set((state) => ({ positions: [{ id: Date.now().toString(), ...pos }, ...state.positions] })),
      updatePosition: (id, data) => set((state) => ({ positions: state.positions.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deletePosition: (id) => set((state) => ({ positions: state.positions.filter((p) => p.id !== id) })),
    }),
    {
      name: 'retailhub-hr-storage',
    }
  )
);
