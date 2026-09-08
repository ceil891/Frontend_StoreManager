import { useSearchParams } from 'react-router';
import { RoleGuard } from '@/routes/RoleGuard';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { NotificationsPage } from './NotificationsPage';
import { SystemConfigPage } from './SystemConfigPage';
import { VatConfigPage } from './VatConfigPage';
import { PrintTemplatesPage } from './PrintTemplatesPage';
import { DeviceSessionsPage } from './DeviceSessionsPage';
import { PasswordHistoryPage } from './PasswordHistoryPage';

const tabs = [
  { id: 'settings', label: 'Cài đặt chung', permission: 'system:settings:view' },
  { id: 'parameters', label: 'Tham số hệ thống', permission: 'system:config:view' },
  { id: 'vat', label: 'Cấu hình thuế VAT', permission: 'system:config:view' },
  { id: 'print-templates', label: 'Mẫu in chứng từ', permission: 'system:config:view' },
  { id: 'notifications', label: 'Cấu hình thông báo', permission: 'system:notification:view' },
  { id: 'device-sessions', label: 'Phiên đăng nhập thiết bị', permission: 'system:device-session:view' },
  { id: 'password-history', label: 'Lịch sử đổi mật khẩu', permission: 'system:password-history:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SystemConfigTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'settings';

  const handleTabChange = (tabId: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình Kỹ thuật & Cài đặt Hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập cài đặt chung doanh nghiệp, tham số hệ thống, thuế VAT, mẫu in, an toàn thiết bị và quy tắc thông báo
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'settings' && (
          <RoleGuard requiredPermission="system:settings:view">
            <SettingsPage />
          </RoleGuard>
        )}
        {activeTab === 'parameters' && (
          <RoleGuard requiredPermission="system:config:view">
            <SystemConfigPage />
          </RoleGuard>
        )}
        {activeTab === 'vat' && (
          <RoleGuard requiredPermission="system:config:view">
            <VatConfigPage />
          </RoleGuard>
        )}
        {activeTab === 'print-templates' && (
          <RoleGuard requiredPermission="system:config:view">
            <PrintTemplatesPage />
          </RoleGuard>
        )}
        {activeTab === 'notifications' && (
          <RoleGuard requiredPermission="system:notification:view">
            <NotificationsPage />
          </RoleGuard>
        )}
        {activeTab === 'device-sessions' && (
          <RoleGuard requiredPermission="system:device-session:view">
            <DeviceSessionsPage />
          </RoleGuard>
        )}
        {activeTab === 'password-history' && (
          <RoleGuard requiredPermission="system:password-history:view">
            <PasswordHistoryPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SystemConfigTabbedPage;
