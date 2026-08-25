import { useSearchParams } from 'react-router';
import { Shield, Key } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { RolesPage } from './RolesPage';
import { PermissionsPage } from './PermissionsPage';

const tabs = [
  { id: 'roles', label: 'Vai trò người dùng', icon: Shield, permission: 'system:role:view' },
  { id: 'permissions', label: 'Danh mục Quyền hạn (Permissions)', icon: Key, permission: 'system:permission:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function HrRolesPermissionsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'roles';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vai trò & Phân quyền Hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập danh mục các Vai trò (Roles) và ma trận chi tiết các Quyền truy cập (Permissions)
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
        {activeTab === 'roles' && (
          <RoleGuard requiredPermission="system:role:view">
            <RolesPage />
          </RoleGuard>
        )}
        {activeTab === 'permissions' && (
          <RoleGuard requiredPermission="system:permission:view">
            <PermissionsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default HrRolesPermissionsTabbedPage;
