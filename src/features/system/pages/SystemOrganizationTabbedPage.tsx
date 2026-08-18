import { useSearchParams } from 'react-router';
import { GitBranch, Image } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { BranchManagementPage } from './BranchManagementPage';
import BannerManagementPage from './BannerManagementPage';

const tabs = [
  { id: 'branches', label: 'Quản lý Chi nhánh', icon: GitBranch, permission: 'system:branch:view' },
  { id: 'banners', label: 'Banner & Quảng cáo', icon: Image, permission: 'system:banner:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SystemOrganizationTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'branches';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cơ sở Chi nhánh & Banner Truyền thông</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý mạng lưới chi nhánh cửa hàng và các hình ảnh banner truyền thông trên hệ thống
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
        {activeTab === 'branches' && (
          <RoleGuard requiredPermission="system:branch:view">
            <BranchManagementPage />
          </RoleGuard>
        )}
        {activeTab === 'banners' && (
          <RoleGuard requiredPermission="system:banner:view">
            <BannerManagementPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SystemOrganizationTabbedPage;
