import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  addLog: (row: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

function nowTimestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const DEFAULT_LOGS: ActivityLogRecord[] = [
  {
    id: 'log_1',
    timestamp: '2026-05-27 09:12:08',
    userName: 'Nguyễn Minh Quân',
    userEmail: 'admin@system.com',
    userCode: 'USR-001',
    role: 'SUPER_ADMIN',
    actionType: 'CREATE',
    moduleName: 'Nhân sự',
    pageName: 'Quản lý người dùng',
    entityType: 'SystemUser',
    entityId: 'usr_005',
    entityLabel: 'Hoàng Thị Mai',
    description: 'Tạo tài khoản nhân viên mới, gán vai trò STAFF, chi nhánh CH Quận 1.',
    branchId: 'HQ',
    branchName: 'Trụ sở chính - TP.HCM',
    ipAddress: '192.168.1.10',
    status: 'SUCCESS',
    changedFields: ['fullName', 'emailAddress', 'assignedRole', 'branchId'],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    sessionId: 'sess_998124',
  },
  {
    id: 'log_2',
    timestamp: '2026-05-27 09:05:41',
    userName: 'Trần Thị Lan',
    userEmail: 'manager@store.com',
    userCode: 'USR-002',
    role: 'STORE_MANAGER',
    actionType: 'UPDATE',
    moduleName: 'Bán hàng',
    pageName: 'Đơn hàng bán',
    entityType: 'SaleOrder',
    entityId: 'so_2048',
    entityLabel: 'ORD-2026-2048',
    description: 'Cập nhật trạng thái đơn từ PENDING → COMPLETED, thanh toán PAID.',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    ipAddress: '192.168.20.15',
    status: 'SUCCESS',
    changedFields: ['status', 'paymentStatus'],
    oldValues: { status: 'PENDING', paymentStatus: 'UNPAID' },
    newValues: { status: 'COMPLETED', paymentStatus: 'PAID' },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    sessionId: 'sess_112001',
  },
  {
    id: 'log_3',
    timestamp: '2026-05-27 08:58:22',
    userName: 'Lê Hoàng Nam',
    userEmail: 'staff@store.com',
    userCode: 'USR-003',
    role: 'STAFF',
    actionType: 'VIEW',
    moduleName: 'CRM',
    pageName: 'Khách hàng',
    entityType: 'Customer',
    entityId: 'cust_12',
    entityLabel: 'Nguyễn Văn An (CUST-12045)',
    description: 'Xem hồ sơ khách hàng và tab lịch sử mua hàng.',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    ipAddress: '192.168.20.22',
    status: 'SUCCESS',
  },
  {
    id: 'log_4',
    timestamp: '2026-05-27 08:44:10',
    userName: 'Phạm Thu Hà',
    userEmail: 'inventory@retailhub.vn',
    userCode: 'USR-004',
    role: 'INVENTORY_STAFF',
    actionType: 'DELETE',
    moduleName: 'Kho',
    pageName: 'Phiếu nhập kho',
    entityType: 'ImportReceipt',
    entityId: 'imp_88',
    entityLabel: 'IMP-2026-0088',
    description: 'Xóa phiếu nhập nháp do nhập trùng mã PO.',
    branchId: 'BR-002',
    branchName: 'CH Tân Bình',
    ipAddress: '192.168.30.8',
    status: 'SUCCESS',
  },
  {
    id: 'log_5',
    timestamp: '2026-05-27 08:30:55',
    userName: 'Trần Thị Lan',
    userEmail: 'manager@store.com',
    userCode: 'USR-002',
    role: 'STORE_MANAGER',
    actionType: 'CREATE',
    moduleName: 'Hệ thống',
    pageName: 'Quản lý chi nhánh',
    entityType: 'Branch',
    entityId: 'BR-006',
    entityLabel: 'CH Thủ Đức',
    description: 'Thêm chi nhánh mới, gán quản lý và chỉ tiêu doanh thu Q2.',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    ipAddress: '192.168.20.15',
    status: 'SUCCESS',
    changedFields: ['name', 'location', 'manager', 'revenueTarget'],
    newValues: { name: 'CH Thủ Đức', location: 'Q. Thủ Đức', manager: 'Trần Thị Lan', revenueTarget: 500000000 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    sessionId: 'sess_112001',
  },
  {
    id: 'log_6',
    timestamp: '2026-05-27 08:15:03',
    userName: 'Nguyễn Minh Quân',
    userEmail: 'admin@system.com',
    userCode: 'USR-001',
    role: 'SUPER_ADMIN',
    actionType: 'UPDATE',
    moduleName: 'Tài chính',
    pageName: 'Phiếu thu',
    entityType: 'ReceiptVoucher',
    entityId: 'rec_12',
    entityLabel: 'REC-2026-0012',
    description: 'Sửa số tiền thu và ghi chú phiếu thu công nợ khách hàng.',
    branchId: 'HQ',
    branchName: 'Trụ sở chính - TP.HCM',
    ipAddress: '192.168.1.10',
    status: 'SUCCESS',
    changedFields: ['amount', 'notes'],
    oldValues: { amount: 1500000, notes: 'Thu tiền cọc' },
    newValues: { amount: 2000000, notes: 'Thu tiền cọc và thanh toán nợ cũ' },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    sessionId: 'sess_998124',
  },
  {
    id: 'log_7',
    timestamp: '2026-05-27 07:55:18',
    userName: 'Lê Hoàng Nam',
    userEmail: 'staff@store.com',
    userCode: 'USR-003',
    role: 'STAFF',
    actionType: 'CREATE',
    moduleName: 'POS',
    pageName: 'Quầy bán hàng',
    entityType: 'SaleOrder',
    entityId: 'so_pos_991',
    entityLabel: 'ORD-POS-2026-991',
    description: 'Thanh toán POS: 3 sản phẩm, tổng 2.450.000đ, tiền mặt.',
    branchId: 'BR-001',
    branchName: 'CH Quận 1',
    ipAddress: '192.168.20.104',
    status: 'SUCCESS',
  },
  {
    id: 'log_8',
    timestamp: '2026-05-27 07:40:00',
    userName: 'unknown',
    userEmail: 'guest@blocked.local',
    role: 'ANONYMOUS',
    actionType: 'VIEW',
    moduleName: 'Hệ thống',
    pageName: 'Đăng nhập',
    entityType: 'AuthSession',
    entityId: '—',
    entityLabel: 'Cổng quản trị',
    description: 'Truy cập trang đăng nhập không có phiên hợp lệ.',
    ipAddress: '185.220.101.4',
    status: 'DENIED',
  },
];

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set) => ({
      logs: DEFAULT_LOGS,
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
