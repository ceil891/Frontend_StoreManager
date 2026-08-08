import { create } from 'zustand';
import { systemService } from '../services/systemService';

// ---------------------------
// TYPES
// ---------------------------
export interface SystemConfigParameter {
  id: string;
  configKey: string;
  category: 'SECURITY_POLICIES' | 'DATABASE_TUNING' | 'API_GATEWAY_THROTTLING' | 'OMNICHANNEL_SYNC' | 'CACHE_STRATEGY';
  value: string;
  dataType: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON' | 'ENUM';
  isEncrypted: boolean;
  requiresRebootToApply: boolean;
  lastUpdatedTimestamp: string;
  updatedByRole: string;
  description: string;
}

export interface PrintTemplateRecord {
  id: string;
  templateCode: string;
  templateName: string;
  documentType: 'POS_RECEIPT_80MM' | 'A4_COMMERCIAL_INVOICE' | 'BARCODE_SHELF_LABEL_50X30' | 'PURCHASE_ORDER_MANIFEST' | 'Z_REPORT_AUDIT_TAPE';
  printerTarget: 'EPSON_TM_T88VI' | 'ZEBRA_ZT411_DPI300' | 'HP_LASERJET_ENTERPRISE' | 'PDF_VIRTUAL_EXPORT';
  formatSyntax: 'ESC_POS_RAW_HEX' | 'ZPL_II_MACRO' | 'HTML5_CSS3_PRINT_MEDIA' | 'JASPER_REPORT_XML';
  version: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'DEVELOPMENT_DRAFT' | 'LEGACY_DEPRECATED';
  lastModifiedTimestamp: string;
  author: string;
  sampleCodeSnippet: string;
}

export interface NotificationRuleRecord {
  id: string;
  ruleCode: string;
  eventName: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION' | 'WEBHOOK_SLACK';
  recipientRoleScope: string;
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  templateSubject: string;
  deliveryCountYtd: number;
  status: 'ACTIVE' | 'PAUSED' | 'TESTING' | 'MUTED';
  lastDispatchedTimestamp: string;
  templateBody: string;
}

export interface DeviceSessionRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'Máy tính' | 'Điện thoại' | 'Máy tính bảng';
  ipAddress: string;
  macAddress?: string;
  userName: string;
  userId: string;
  loginTime: string;
  lastActive: string;
  status: 'ACTIVE' | 'REVOKED';
  location: string;
  userAgent?: string;
}

export interface PasswordHistoryRecord {
  id: string;
  userName: string;
  changedAt: string;
  changedBy: string;
  reason: string;
}

export interface SystemErrorLogRecord {
  id: string;
  logCode: string;
  serviceName: string;
  errorMessage: string;
  stackTrace: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  timestamp: string;
}

// ---------------------------
// STORE STATE INTERFACE
// ---------------------------
interface SystemState {
  configs: SystemConfigParameter[];
  printTemplates: PrintTemplateRecord[];
  notifications: NotificationRuleRecord[];
  deviceSessions: DeviceSessionRecord[];
  passwordHistories: PasswordHistoryRecord[];
  systemErrorLogs: SystemErrorLogRecord[];
  isLoading: boolean;
  error: string | null;

  fetchConfigs: () => Promise<void>;
  addConfig: (config: Omit<SystemConfigParameter, 'id'>) => Promise<void>;
  updateConfig: (id: string, data: Partial<SystemConfigParameter>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;

  fetchPrintTemplates: () => Promise<void>;
  addPrintTemplate: (tpl: Omit<PrintTemplateRecord, 'id'>) => Promise<void>;
  updatePrintTemplate: (id: string, data: Partial<PrintTemplateRecord>) => Promise<void>;
  deletePrintTemplate: (id: string) => Promise<void>;

  fetchNotificationRules: () => Promise<void>;
  addNotificationRule: (rule: Omit<NotificationRuleRecord, 'id'>) => Promise<void>;
  updateNotificationRule: (id: string, data: Partial<NotificationRuleRecord>) => Promise<void>;
  deleteNotificationRule: (id: string) => Promise<void>;

  fetchDeviceSessions: () => Promise<void>;
  revokeDeviceSession: (id: string) => Promise<void>;
  fetchPasswordHistories: () => Promise<void>;
  fetchSystemErrorLogs: () => Promise<void>;
}

// Default Fallback Seeds if API returns empty
const DEFAULT_DEVICE_SESSIONS: DeviceSessionRecord[] = [
  {
    id: '1',
    deviceId: 'DEV-WIN-88192',
    deviceName: 'Chrome 126.0 / Windows 11 Pro - Terminal POS 01',
    deviceType: 'Máy tính',
    ipAddress: '192.168.1.102',
    macAddress: 'C4-65-16-8A-90-E1',
    userName: 'Trần Thị Thủy (Thu ngân POS)',
    userId: 'EMP-001',
    loginTime: '2026-08-06 07:30:15',
    lastActive: '2026-08-06 19:05:22',
    status: 'ACTIVE',
    location: 'Việt Nam - TP. Hồ Chí Minh (Chi nhánh Quận 1)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    deviceId: 'DEV-IOS-44120',
    deviceName: 'Safari Mobile / iPad Air 5 - Barcode Scanner WMS',
    deviceType: 'Máy tính bảng',
    ipAddress: '192.168.1.108',
    macAddress: '70-EE-50-2B-11-9F',
    userName: 'Nguyễn Văn Nam (Quản lý kho)',
    userId: 'EMP-004',
    loginTime: '2026-08-06 08:15:00',
    lastActive: '2026-08-06 18:40:10',
    status: 'ACTIVE',
    location: 'Việt Nam - TP. Hồ Chí Minh (Kho trung tâm Thủ Đức)',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    id: '3',
    deviceId: 'DEV-AND-99231',
    deviceName: 'RetailHub App / Samsung Galaxy Tab S9 - Trưởng ca',
    deviceType: 'Điện thoại',
    ipAddress: '113.161.72.45',
    macAddress: 'B8-27-EB-41-89-02',
    userName: 'Phạm Hoàng Long (Cửa hàng trưởng)',
    userId: 'EMP-002',
    loginTime: '2026-08-05 14:20:00',
    lastActive: '2026-08-06 17:15:30',
    status: 'ACTIVE',
    location: 'Việt Nam - Hà Nội (Chi nhánh Cầu Giấy)',
    userAgent: 'RetailHubMobile/2.4.0 (Android 14; SM-X710)'
  },
];

const DEFAULT_PASSWORD_HISTORIES: PasswordHistoryRecord[] = [
  { id: '1', userName: 'nguyenvanan', changedAt: '2026-06-01 10:00', changedBy: 'Admin', reason: 'Đổi mật khẩu định kỳ 90 ngày' },
  { id: '2', userName: 'tranthithuy', changedAt: '2026-05-15 14:20', changedBy: 'User Self-Service', reason: 'Reset mật khẩu qua Email' },
];

const DEFAULT_ERROR_LOGS: SystemErrorLogRecord[] = [
  { id: '1', logCode: 'ERR-500-8819', serviceName: 'Order-Service', errorMessage: 'Database Connection Timeout on Order Flush', stackTrace: 'ConnectionPoolTimeoutException at HikariCP pool-1', severity: 'CRITICAL', timestamp: '2026-07-25 11:20:15' },
  { id: '2', logCode: 'ERR-400-9921', serviceName: 'Sync-Gateway', errorMessage: 'Shopee Webhook Signature Verification Failed', stackTrace: 'InvalidSignatureException at WebhookValidator.java:45', severity: 'WARNING', timestamp: '2026-07-25 10:05:00' },
];

export const useSystemStore = create<SystemState>()((set) => ({
  configs: [],
  printTemplates: [],
  notifications: [],
  deviceSessions: DEFAULT_DEVICE_SESSIONS,
  passwordHistories: DEFAULT_PASSWORD_HISTORIES,
  systemErrorLogs: DEFAULT_ERROR_LOGS,
  isLoading: false,
  error: null,

  fetchConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchConfigs();
      set({ configs: data, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch configs:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải cấu hình hệ thống' });
    }
  },

  addConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const created = await systemService.addConfig(config);
      set((state) => ({ configs: [created, ...state.configs], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add config:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm cấu hình' });
      throw e;
    }
  },

  updateConfig: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await systemService.updateConfig(id, data);
      set((state) => ({
        configs: state.configs.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to update config:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật cấu hình' });
      throw e;
    }
  },

  deleteConfig: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await systemService.deleteConfig(id);
      set((state) => ({
        configs: state.configs.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete config:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi xóa cấu hình' });
      throw e;
    }
  },

  fetchPrintTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchPrintTemplates();
      set({ printTemplates: data, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch print templates:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải mẫu in' });
    }
  },

  addPrintTemplate: async (tpl) => {
    set({ isLoading: true, error: null });
    try {
      const created = await systemService.addPrintTemplate(tpl);
      set((state) => ({ printTemplates: [created, ...state.printTemplates], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add print template:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm mẫu in' });
      throw e;
    }
  },

  updatePrintTemplate: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await systemService.updatePrintTemplate(id, data);
      set((state) => ({
        printTemplates: state.printTemplates.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to update print template:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật mẫu in' });
      throw e;
    }
  },

  deletePrintTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await systemService.deletePrintTemplate(id);
      set((state) => ({
        printTemplates: state.printTemplates.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete print template:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi xóa mẫu in' });
      throw e;
    }
  },

  fetchNotificationRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchNotificationRules();
      if (data.length > 0) set({ notifications: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch notification rules:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải quy tắc thông báo' });
    }
  },

  addNotificationRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      const created = await systemService.addNotificationRule(rule);
      set((state) => ({ notifications: [created, ...state.notifications], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to add notification rule:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm quy tắc thông báo' });
      throw e;
    }
  },

  updateNotificationRule: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await systemService.updateNotificationRule(id, data);
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updated } : n)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to update notification rule:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật quy tắc thông báo' });
      throw e;
    }
  },

  deleteNotificationRule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await systemService.deleteNotificationRule(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to delete notification rule on API:', e);
      // Even if mock endpoint errors, perform state update cleanly
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        isLoading: false,
      }));
    }
  },

  fetchDeviceSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchDeviceSessions();
      if (data.length > 0) set({ deviceSessions: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch device sessions:', e);
      set({ isLoading: false });
    }
  },

  revokeDeviceSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await systemService.revokeDeviceSession(id);
      set((state) => ({
        deviceSessions: state.deviceSessions.map((s) => (s.id === id ? { ...s, status: 'REVOKED' } : s)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to revoke device session:', e);
      set((state) => ({
        deviceSessions: state.deviceSessions.map((s) => (s.id === id ? { ...s, status: 'REVOKED' } : s)),
        isLoading: false,
      }));
    }
  },

  fetchPasswordHistories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchPasswordHistories();
      if (data.length > 0) set({ passwordHistories: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch password histories:', e);
      set({ isLoading: false });
    }
  },

  fetchSystemErrorLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await systemService.fetchSystemErrorLogs();
      if (data.length > 0) set({ systemErrorLogs: data });
      set({ isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch system error logs:', e);
      set({ isLoading: false });
    }
  },
}));
