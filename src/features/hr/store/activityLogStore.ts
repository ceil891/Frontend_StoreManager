import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export type ActivityActionType = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface ActivityLogRecord {
  id: string;
  /** Thời điểm thực hiện — `YYYY-MM-DD HH:mm:ss` */
  timestamp: string;
  /** Họ tên người thao tác */
  userName: string;
  /** Email / tài khoản đăng nhập */
  userEmail: string;
  userCode?: string;
  role: string;
  /** Xem | Thêm | Sửa | Xóa */
  actionType: ActivityActionType;
  /** Phân hệ: HR, Bán hàng, Kho, Tài chính… */
  moduleName: string;
  /** Tên màn hình */
  pageName: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  branchId?: string;
  branchName?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  changedFields?: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userAgent?: string;
  sessionId?: string;
}

interface ActivityLogState {
  logs: ActivityLogRecord[];
  fetchLogs: () => Promise<void>;
  addLog: (row: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

function nowTimestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}



export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set) => ({
      logs: [],
      fetchLogs: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/audit-logs');
          const data = res.content || res || [];
          if (Array.isArray(data)) {
            set({ logs: data });
          }
        } catch (e) {
          console.error('Failed to fetch logs:', e);
        }
      },
      addLog: (row) =>
        set((s) => ({
          logs: [
            {
              id: `log_${Date.now()}`,
              timestamp: row.timestamp ?? nowTimestamp(),
              ...row,
            },
            ...s.logs,
          ].slice(0, 500),
        })),
    }),
    {
      name: 'retailhub-activity-logs',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<ActivityLogState> | undefined;
        const c = current as ActivityLogState;
        if (!p?.logs?.length) return c;
        return { ...c, logs: p.logs };
      },
    }
  )
);

export const ACTION_LABEL: Record<ActivityActionType, string> = {
  VIEW: 'Xem',
  CREATE: 'Thêm',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
};

export const ACTION_STYLES: Record<ActivityActionType, string> = {
  VIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};
