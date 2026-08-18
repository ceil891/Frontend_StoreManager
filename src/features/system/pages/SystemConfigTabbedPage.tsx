import { useSearchParams } from 'react-router';
import { Sliders, Settings, Receipt } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SystemConfigPage } from './SystemConfigPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { VatConfigPage } from './VatConfigPage';

const tabs = [
  { id: 'config', label: 'Tham số hệ thống', icon: Sliders, permission: 'system:config:view' },
  { id: 'settings', label: 'Cài đặt chung', icon: Settings, permission: 'system:settings:view' },
  { id: 'vat', label: 'Cấu hình Thuế VAT', icon: Receipt, permission: 'system:vat:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SystemConfigTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'config';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình Kỹ thuật & Cài đặt Chung</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập tham số hệ thống, cài đặt chung doanh nghiệp và cấu hình tỷ lệ thuế VAT
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
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
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'config' && (
          <RoleGuard requiredPermission="system:config:view">
            <SystemConfigPage />
          </RoleGuard>
        )}
        {activeTab === 'settings' && (
          <RoleGuard requiredPermission="system:settings:view">
            <SettingsPage />
          </RoleGuard>
        )}
        {activeTab === 'vat' && (
          <RoleGuard requiredPermission="system:vat:view">
            <VatConfigPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SystemConfigTabbedPage;
