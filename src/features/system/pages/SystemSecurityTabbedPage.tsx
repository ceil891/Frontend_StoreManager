import { useSearchParams } from 'react-router';
import { Smartphone, KeyRound } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { DeviceSessionsPage } from './DeviceSessionsPage';
import { PasswordHistoryPage } from './PasswordHistoryPage';

const tabs = [
  { id: 'device-sessions', label: 'Phiên đăng nhập thiết bị', icon: Smartphone, permission: 'system:device-session:view' },
  { id: 'password-history', label: 'Lịch sử đổi mật khẩu', icon: KeyRound, permission: 'system:password-history:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SystemSecurityTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'device-sessions';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">An toàn & Bảo mật Hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi danh sách thiết bị đang đăng nhập tài khoản và lịch sử thay đổi mật khẩu người dùng
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

export default SystemSecurityTabbedPage;
