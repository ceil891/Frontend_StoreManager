import { axiosClient } from '@/shared/lib/axiosClient';
import type {
  SystemConfigParameter,
  PrintTemplateRecord,
  NotificationRuleRecord,
  DeviceSessionRecord,
  PasswordHistoryRecord,
  SystemErrorLogRecord,
} from '../store/systemStore';

export const systemService = {
  // --- Configs ---
  async fetchConfigs(): Promise<SystemConfigParameter[]> {
    const res = await axiosClient.get<any, any>('/system/configs');
    const data = Array.isArray(res) ? res : (res?.content || res?.items || []);
    return data.map((item: any) => ({
      id: String(item.id),
      configKey: item.configKey || item.key || '',
      category: item.category || 'SECURITY_POLICIES',
      value: item.value || '',
      dataType: item.dataType || 'STRING',
      isEncrypted: !!item.isEncrypted,
      requiresRebootToApply: !!item.requiresRebootToApply,
      lastUpdatedTimestamp: item.updatedAt ? item.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      updatedByRole: item.updatedByRole || 'SUPER_ADMIN',
      description: item.description || '',
    }));
  },

  async addConfig(config: Omit<SystemConfigParameter, 'id'>): Promise<SystemConfigParameter> {
    const res = await axiosClient.post<any, any>('/system/configs', config);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      configKey: item?.configKey || config.configKey,
      category: item?.category || config.category,
      value: item?.value || config.value,
      dataType: item?.dataType || config.dataType,
      isEncrypted: item?.isEncrypted !== undefined ? item.isEncrypted : config.isEncrypted,
      requiresRebootToApply: item?.requiresRebootToApply !== undefined ? item.requiresRebootToApply : config.requiresRebootToApply,
      lastUpdatedTimestamp: item?.updatedAt ? item.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      updatedByRole: item?.updatedByRole || config.updatedByRole,
      description: item?.description || config.description,
    };
  },

  async updateConfig(id: string, data: Partial<SystemConfigParameter>): Promise<Partial<SystemConfigParameter>> {
    const res = await axiosClient.put<any, any>(`/system/configs/${id}`, data);
    return res?.data || res || data;
  },

  async deleteConfig(id: string): Promise<void> {
    await axiosClient.delete(`/system/configs/${id}`);
  },

  // --- Print Templates ---
  async fetchPrintTemplates(): Promise<PrintTemplateRecord[]> {
    const res = await axiosClient.get<any, any>('/system/templates');
    const data = Array.isArray(res) ? res : (res?.content || []);
    return data.map((item: any) => ({
      id: String(item.id),
      templateCode: item.templateCode || '',
      templateName: item.templateName || '',
      documentType: item.documentType || 'POS_RECEIPT_80MM',
      printerTarget: item.printerTarget || 'EPSON_TM_T88VI',
      formatSyntax: item.formatSyntax || 'HTML5_CSS3_PRINT_MEDIA',
      version: item.version || '1.0',
      isDefault: !!item.isDefault,
      status: item.status || 'ACTIVE',
      lastModifiedTimestamp: item.updatedAt ? item.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      author: item.author || 'System Admin',
      sampleCodeSnippet: item.sampleCodeSnippet || item.templateContent || '',
    }));
  },

  async addPrintTemplate(tpl: Omit<PrintTemplateRecord, 'id'>): Promise<PrintTemplateRecord> {
    const res = await axiosClient.post<any, any>('/system/templates', tpl);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...tpl,
      ...(item || {}),
    };
  },

  async updatePrintTemplate(id: string, data: Partial<PrintTemplateRecord>): Promise<Partial<PrintTemplateRecord>> {
    const res = await axiosClient.put<any, any>(`/system/templates/${id}`, data);
    return res?.data || res || data;
  },

  async deletePrintTemplate(id: string): Promise<void> {
    await axiosClient.delete(`/system/templates/${id}`);
  },

  // --- Notification Rules ---
  async fetchNotificationRules(): Promise<NotificationRuleRecord[]> {
    const res = await axiosClient.get<any, any>('/system/notifications');
    const data = Array.isArray(res) ? res : (res?.content || res || []);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
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
    }));
  },

  async addNotificationRule(rule: Omit<NotificationRuleRecord, 'id'>): Promise<NotificationRuleRecord> {
    const res = await axiosClient.post<any, any>('/system/notifications', rule);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...rule,
      ...(item || {}),
    };
  },

  async updateNotificationRule(id: string, data: Partial<NotificationRuleRecord>): Promise<Partial<NotificationRuleRecord>> {
    const res = await axiosClient.put<any, any>(`/system/notifications/${id}`, data);
    return res?.data || res || data;
  },

  async deleteNotificationRule(id: string): Promise<void> {
    await axiosClient.delete(`/system/notifications/${id}`);
  },

  // --- Device Sessions ---
  async fetchDeviceSessions(): Promise<DeviceSessionRecord[]> {
    const res = await axiosClient.get<any, any>('/system/device-sessions');
    const data = Array.isArray(res) ? res : (res?.content || []);
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item: any) => ({
      id: String(item.id || item.refreshTokenId),
      deviceId: item.deviceId || item.deviceCode || `DEV-${item.id}`,
      deviceName: item.deviceName || item.deviceInfo || 'Chrome Browser',
      deviceType: item.deviceType || 'Máy tính',
      ipAddress: item.ipAddress || item.ip || '127.0.0.1',
      macAddress: item.macAddress || '',
      userName: item.user?.fullName || item.userName || 'Nghĩa NV',
      userId: item.user?.id ? `EMP-${item.user.id}` : (item.userId || 'EMP-001'),
      loginTime: item.createdAt ? item.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
      lastActive: item.expiresAt ? item.expiresAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: item.revoked ? 'REVOKED' : 'ACTIVE',
      location: item.location || 'Việt Nam',
      userAgent: item.userAgent || '',
    }));
  },

  async revokeDeviceSession(id: string): Promise<void> {
    await axiosClient.delete(`/system/device-sessions/${id}`);
  },

  // --- Password Histories ---
  async fetchPasswordHistories(): Promise<PasswordHistoryRecord[]> {
    const res = await axiosClient.get<any, any>('/system/password-histories');
    const data = Array.isArray(res) ? res : (res?.content || []);
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      userName: item.userName || item.username || item.user?.username || 'N/A',
      changedAt: item.changedAt ? item.changedAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
      changedBy: item.changedBy || 'Admin',
      reason: item.reason || 'Cập nhật mật khẩu bảo mật',
    }));
  },

  // --- System Error Logs ---
  async fetchSystemErrorLogs(): Promise<SystemErrorLogRecord[]> {
    const res = await axiosClient.get<any, any>('/system/error-logs');
    const data = Array.isArray(res) ? res : (res?.content || []);
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item: any) => ({
      id: String(item.id),
      logCode: item.logCode || `ERR-${item.id}`,
      serviceName: item.serviceName || 'App-Service',
      errorMessage: item.errorMessage || item.message || '',
      stackTrace: item.stackTrace || '',
      severity: item.severity || 'WARNING',
      timestamp: item.timestamp ? item.timestamp.replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19),
    }));
  },
};
