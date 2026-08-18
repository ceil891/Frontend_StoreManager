import { useSearchParams } from 'react-router';
import { UserCheck, Building, BadgeCheck, FileClock } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { UsersPage } from './UsersPage';
import { DepartmentsPage } from './DepartmentsPage';
import { PositionsPage } from './PositionsPage';
import { ActivityLogsPage } from './ActivityLogsPage';

const tabs = [
  { id: 'users', label: 'Nhân viên / Người dùng', icon: UserCheck, permission: 'system:user:view' },
  { id: 'departments', label: 'Phòng ban', icon: Building, permission: 'catalog:department:view' },
  { id: 'positions', label: 'Chức danh công việc', icon: BadgeCheck, permission: 'hr:position:view' },
  { id: 'logs', label: 'Nhật ký hoạt động nhân viên', icon: FileClock, permission: 'hr:log:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function HrEmployeesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'users';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Hồ sơ Nhân sự</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý hồ sơ nhân viên, cơ cấu phòng ban, danh mục vị trí công việc và nhật ký thao tác nhân sự
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
        {activeTab === 'users' && (
          <RoleGuard requiredPermission="system:user:view">
            <UsersPage />
          </RoleGuard>
        )}
        {activeTab === 'departments' && (
          <RoleGuard requiredPermission="catalog:department:view">
            <DepartmentsPage />
          </RoleGuard>
        )}
        {activeTab === 'positions' && (
          <RoleGuard requiredPermission="hr:position:view">
            <PositionsPage />
          </RoleGuard>
        )}
        {activeTab === 'logs' && (
          <RoleGuard requiredPermission="hr:log:view">
            <ActivityLogsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default HrEmployeesTabbedPage;
