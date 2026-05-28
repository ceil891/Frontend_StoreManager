import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Config Actions
  addConfig: (config: Omit<SystemConfigParameter, 'id'>) => void;
  updateConfig: (id: string, data: Partial<SystemConfigParameter>) => void;
  deleteConfig: (id: string) => void;

  // Print Template Actions
  addPrintTemplate: (tpl: Omit<PrintTemplateRecord, 'id'>) => void;
  updatePrintTemplate: (id: string, data: Partial<PrintTemplateRecord>) => void;
  deletePrintTemplate: (id: string) => void;

  // Notification Actions
  addNotificationRule: (rule: Omit<NotificationRuleRecord, 'id'>) => void;
  updateNotificationRule: (id: string, data: Partial<NotificationRuleRecord>) => void;
  deleteNotificationRule: (id: string) => void;
}

// ---------------------------
// MOCK DATA SEED
// ---------------------------
const MOCK_CONFIGS: SystemConfigParameter[] = [
  { id: '1', configKey: 'SECURITY.MFA_TOTP.ISSUER_NAME', category: 'SECURITY_POLICIES', value: 'RetailHub Enterprise Secure Auth', dataType: 'STRING', isEncrypted: false, requiresRebootToApply: false, lastUpdatedTimestamp: '2024-05-01 10:00:00', updatedByRole: 'ROLE-SUPERADMIN', description: 'The issuer name embedded inside Google Authenticator or Duo Security TOTP QR codes.' },
  { id: '2', configKey: 'DB.POOL.MAX_CONNECTIONS', category: 'DATABASE_TUNING', value: '250', dataType: 'INTEGER', isEncrypted: false, requiresRebootToApply: true, lastUpdatedTimestamp: '2024-03-15 02:30:00', updatedByRole: 'ROLE-SYSARCHITECT', description: 'Maximum HikariCP connection pool limit across multi-tenant database clusters.' },
  { id: '3', configKey: 'API.RATE_LIMIT.GLOBAL_BURST_PER_SEC', category: 'API_GATEWAY_THROTTLING', value: '1500', dataType: 'INTEGER', isEncrypted: false, requiresRebootToApply: false, lastUpdatedTimestamp: '2024-05-18 01:15:00', updatedByRole: 'ROLE-SUPERADMIN', description: 'Token bucket leaky-bucket algorithm max burst limit per second across external third-party POS API endpoints.' },
  { id: '4', configKey: 'SYNC.SHOPIFY_WEBHOOK.SECRET_SIGNATURE', category: 'OMNICHANNEL_SYNC', value: '••••••••••••••••••••••••••••••••', dataType: 'STRING', isEncrypted: true, requiresRebootToApply: false, lastUpdatedTimestamp: '2024-04-20 18:45:00', updatedByRole: 'ROLE-SUPERADMIN', description: 'HMAC-SHA256 cryptographic webhook validation secret for automated inventory level syncing.' },
  { id: '5', configKey: 'REDIS.CLUSTER.EVICTION_POLICY', category: 'CACHE_STRATEGY', value: 'allkeys-lru', dataType: 'ENUM', isEncrypted: false, requiresRebootToApply: true, lastUpdatedTimestamp: '2024-01-10 09:00:00', updatedByRole: 'ROLE-SYSARCHITECT', description: 'Least Recently Used (LRU) memory eviction policy for in-memory Redis cluster nodes.' },
];

const MOCK_PRINT_TEMPLATES: PrintTemplateRecord[] = [
  { id: '1', templateCode: 'TPL-POS-80MM-V2', templateName: 'Standard 80mm POS Thermal Cash Receipt', documentType: 'POS_RECEIPT_80MM', printerTarget: 'EPSON_TM_T88VI', formatSyntax: 'ESC_POS_RAW_HEX', version: 'v2.4.1', isDefault: true, status: 'ACTIVE', lastModifiedTimestamp: '2024-05-18 05:30:00', author: 'Johnathan Vance', sampleCodeSnippet: '\x1B\x40\x1B\x61\x01\x1B\x45\x01RETAILHUB FLAGSHIP PLAZA\x0A123 5th Ave, New York, NY\x0A----------------------------------------\x0A' },
  { id: '2', templateCode: 'TPL-INV-A4-CORP', templateName: 'A4 B2B Corporate Commercial Tax Invoice', documentType: 'A4_COMMERCIAL_INVOICE', printerTarget: 'HP_LASERJET_ENTERPRISE', formatSyntax: 'HTML5_CSS3_PRINT_MEDIA', version: 'v3.1.0', isDefault: true, status: 'ACTIVE', lastModifiedTimestamp: '2024-05-10 14:20:00', author: 'Sarah Jenkins', sampleCodeSnippet: '<!DOCTYPE html>\n<html>\n<head><style>@media print { body { font-family: "Inter", sans-serif; font-size: 10pt; } }</style></head>\n<body><h1>TAX INVOICE</h1>...</body></html>' },
  { id: '3', templateCode: 'TPL-LBL-50X30', templateName: 'Zebra 50x30mm SKU Price & Barcode Tag', documentType: 'BARCODE_SHELF_LABEL_50X30', printerTarget: 'ZEBRA_ZT411_DPI300', formatSyntax: 'ZPL_II_MACRO', version: 'v1.0.5', isDefault: true, status: 'ACTIVE', lastModifiedTimestamp: '2024-04-15 09:12:00', author: 'Marcus Aurelius', sampleCodeSnippet: '^XA\n^FO50,50^ADN,36,20^FDRETAILHUB SKU^FS\n^FO50,100^BCN,100,Y,N,N^FD{{sku_code}}^FS\n^XZ' },
];

const MOCK_NOTIFICATIONS: NotificationRuleRecord[] = [
  { id: '1', ruleCode: 'NTF-STK-01', eventName: 'Inventory Critical Low Stock Alert', channel: 'WEBHOOK_SLACK', recipientRoleScope: 'ROLE-STORE-MGR, ROLE-PURCHASE-MGR', urgency: 'CRITICAL', templateSubject: '🚨 [URGENT] SKU Stock Depleted Below Minimum Buffer', deliveryCountYtd: 342, status: 'ACTIVE', lastDispatchedTimestamp: '2024-05-18 06:12:00', templateBody: 'Item {{sku_name}} (Code: {{sku_code}}) in branch {{branch_name}} has reached {{current_stock}} units. Reorder threshold is {{min_threshold}}.' },
  { id: '2', ruleCode: 'NTF-FIN-02', eventName: 'Large Wire Transfer Approval Mandate', channel: 'EMAIL', recipientRoleScope: 'ROLE-CFO-TREASURY, ROLE-SUPERADMIN', urgency: 'CRITICAL', templateSubject: '⚠️ Cash Outflow Authorization Required > $50,000', deliveryCountYtd: 45, status: 'ACTIVE', lastDispatchedTimestamp: '2024-05-17 16:30:22', templateBody: 'A pending ACH/Wire disbursement request #{{transfer_id}} for ${{amount}} to vendor {{vendor_name}} requires dual-custody approval.' },
];

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      configs: MOCK_CONFIGS,
      printTemplates: MOCK_PRINT_TEMPLATES,
      notifications: MOCK_NOTIFICATIONS,

      // Config Actions
      addConfig: (config) => set((state) => ({ configs: [{ id: Date.now().toString(), ...config }, ...state.configs] })),
      updateConfig: (id, data) => set((state) => ({ configs: state.configs.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteConfig: (id) => set((state) => ({ configs: state.configs.filter((c) => c.id !== id) })),

      // Print Template Actions
      addPrintTemplate: (tpl) => set((state) => ({ printTemplates: [{ id: Date.now().toString(), ...tpl }, ...state.printTemplates] })),
      updatePrintTemplate: (id, data) => set((state) => ({ printTemplates: state.printTemplates.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      deletePrintTemplate: (id) => set((state) => ({ printTemplates: state.printTemplates.filter((t) => t.id !== id) })),

      // Notification Actions
      addNotificationRule: (rule) => set((state) => ({ notifications: [{ id: Date.now().toString(), ...rule }, ...state.notifications] })),
      updateNotificationRule: (id, data) => set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...data } : n)) })),
      deleteNotificationRule: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
    }),
    {
      name: 'retailhub-system-storage',
    }
  )
);
