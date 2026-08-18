import { useSearchParams } from 'react-router';
import { FixedAssetsPage } from './FixedAssetsPage';
import { DepreciationHistoryPage } from './DepreciationHistoryPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { Archive, Activity } from 'lucide-react';

const tabs = [
  { id: 'assets', label: 'Tài sản cố định', icon: Archive, permission: 'finance:fixed-asset:view' },
  { id: 'depreciation', label: 'Lịch sử khấu hao', icon: Activity, permission: 'finance:depreciation-history:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function FixedAssetsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'assets';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tài sản Cố định & Khấu hao</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tài sản cố định của doanh nghiệp và theo dõi lịch sử khấu hao định kỳ
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
        {activeTab === 'assets' && (
          <RoleGuard requiredPermission="finance:fixed-asset:view">
            <FixedAssetsPage />
          </RoleGuard>
        )}
        {activeTab === 'depreciation' && (
          <RoleGuard requiredPermission="finance:depreciation-history:view">
            <DepreciationHistoryPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default FixedAssetsTabbedPage;
