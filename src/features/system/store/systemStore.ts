import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

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

// ---------------------------
// STORE STATE INTERFACE
// ---------------------------
interface SystemState {
  configs: SystemConfigParameter[];
  printTemplates: PrintTemplateRecord[];
  notifications: NotificationRuleRecord[];
  isLoading: boolean;

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

  deviceSessions: DeviceSessionRecord[];
  passwordHistories: PasswordHistoryRecord[];
  systemErrorLogs: SystemErrorLogRecord[];

  fetchDeviceSessions: () => Promise<void>;
  fetchPasswordHistories: () => Promise<void>;
  fetchSystemErrorLogs: () => Promise<void>;
}

export interface DeviceSessionRecord {
  id: string;
  deviceName: string;
  ipAddress: string;
  userName: string;
  loginTime: string;
  status: 'ACTIVE' | 'REVOKED';
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



export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      configs: [],
      printTemplates: [],
      notifications: [],
      isLoading: false,

      fetchConfigs: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/config');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ configs: data.map((item: any) => ({
              id: String(item.id),
              configKey: item.configKey || '',
              category: item.category || 'SECURITY_POLICIES',
              value: item.value || '',
              dataType: item.dataType || 'STRING',
              isEncrypted: Boolean(item.isEncrypted),
              requiresRebootToApply: Boolean(item.requiresRebootToApply),
              lastUpdatedTimestamp: item.updatedAt ? item.updatedAt.split('T')[0] : '',
              updatedByRole: item.updatedBy || 'ROLE-SUPERADMIN',
              description: item.description || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch configs:', e);
        }
      },
      addConfig: async (config) => {
        try { await axiosClient.post('/system/config', config); } catch (e) { console.error(e); }
        set((state) => ({ configs: [{ id: Date.now().toString(), ...config }, ...state.configs] }));
      },
      updateConfig: async (id, data) => {
        try { await axiosClient.put(`/system/config/${id}`, data); } catch (e) { console.error(e); }
        set((state) => ({ configs: state.configs.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
      },
      deleteConfig: async (id) => {
        try { await axiosClient.delete(`/system/config/${id}`); } catch (e) { console.error(e); }
        set((state) => ({ configs: state.configs.filter((c) => c.id !== id) }));
      },

      fetchPrintTemplates: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/templates');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ printTemplates: data.map((item: any) => ({
              id: String(item.id),
              templateCode: item.templateCode || '',
              templateName: item.templateName || '',
              documentType: item.documentType || 'POS_RECEIPT_80MM',
              printerTarget: item.printerTarget || 'EPSON_TM_T88VI',
              formatSyntax: item.formatSyntax || 'ESC_POS_RAW_HEX',
              version: item.version || '1.0.0',
              isDefault: Boolean(item.isDefault),
              status: item.status || 'ACTIVE',
              lastModifiedTimestamp: item.updatedAt ? item.updatedAt.split('T')[0] : '',
              author: item.updatedBy || 'System',
              sampleCodeSnippet: item.templateBody || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch print templates:', e);
        }
      },
      addPrintTemplate: async (tpl) => {
        try { await axiosClient.post('/system/templates', tpl); } catch (e) { console.error(e); }
        set((state) => ({ printTemplates: [{ id: Date.now().toString(), ...tpl }, ...state.printTemplates] }));
      },
      updatePrintTemplate: async (id, data) => {
        try { await axiosClient.put(`/system/templates/${id}`, data); } catch (e) { console.error(e); }
        set((state) => ({ printTemplates: state.printTemplates.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
      },
      deletePrintTemplate: async (id) => {
        try { await axiosClient.delete(`/system/templates/${id}`); } catch (e) { console.error(e); }
        set((state) => ({ printTemplates: state.printTemplates.filter((t) => t.id !== id) }));
      },

      fetchNotificationRules: async () => {
        try {
          const res = await axiosClient.get<any, any>('/system/notifications');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ notifications: data.map((item: any) => ({
              id: String(item.id),
              ruleCode: item.ruleCode || '',
              eventName: item.eventName || '',
              channel: item.channel || 'EMAIL',
              recipientRoleScope: item.recipientRoleScope || '',
              urgency: item.urgency || 'NORMAL',
              templateSubject: item.templateSubject || '',
              deliveryCountYtd: Number(item.deliveryCount || 0),
              status: item.status || 'ACTIVE',
              lastDispatchedTimestamp: item.updatedAt ? item.updatedAt.split('T')[0] : '',
              templateBody: item.templateBody || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch notification rules:', e);
        }
      },
      addNotificationRule: async (rule) => {
        set((state) => ({ notifications: [{ id: Date.now().toString(), ...rule }, ...state.notifications] }));
      },
      updateNotificationRule: async (id, data) => {
        set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...data } : n)) }));
      },
      deviceSessions: [
        { id: '1', deviceName: 'Chrome / Windows 11 - Flagship POS 01', ipAddress: '192.168.1.102', userName: 'Trần Thị Thủy', loginTime: '2026-07-25 07:30', status: 'ACTIVE' },
        { id: '2', deviceName: 'Safari / iPad Air - Inventory Scanner', ipAddress: '192.168.1.108', userName: 'Nguyễn Văn Nam', loginTime: '2026-07-25 08:15', status: 'ACTIVE' },
      ],
      passwordHistories: [
        { id: '1', userName: 'nguyenvanan', changedAt: '2026-06-01 10:00', changedBy: 'Admin', reason: 'Đổi mật khẩu định kỳ 90 ngày' },
        { id: '2', userName: 'tranthithuy', changedAt: '2026-05-15 14:20', changedBy: 'User Self-Service', reason: 'Reset mật khẩu qua Email' },
      ],
      systemErrorLogs: [
        { id: '1', logCode: 'ERR-500-8819', serviceName: 'Order-Service', errorMessage: 'Database Connection Timeout on Order Flush', stackTrace: 'ConnectionPoolTimeoutException at HikariCP pool-1', severity: 'CRITICAL', timestamp: '2026-07-25 11:20:15' },
        { id: '2', logCode: 'ERR-400-9921', serviceName: 'Sync-Gateway', errorMessage: 'Shopee Webhook Signature Verification Failed', stackTrace: 'InvalidSignatureException at WebhookValidator.java:45', severity: 'WARNING', timestamp: '2026-07-25 10:05:00' },
      ],

      fetchDeviceSessions: async () => {},
      fetchPasswordHistories: async () => {},
      fetchSystemErrorLogs: async () => {},

      deleteNotificationRule: async (id) => {
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
      },
    }),
    {
      name: 'retailhub-system-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
