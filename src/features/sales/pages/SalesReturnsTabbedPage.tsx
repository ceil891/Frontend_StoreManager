import { useSearchParams } from 'react-router';
import { ReturnsListsPage } from './ReturnsListsPage';
import { CustomerReturnsPage } from './CustomerReturnsPage';
import { ReturnsHistoryPage } from './ReturnsHistoryPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { RotateCcw, CheckCircle, History } from 'lucide-react';

const tabs = [
  { id: 'requests', label: 'Yêu cầu trả hàng', icon: RotateCcw, permission: 'sales:return-request:view' },
  { id: 'returns', label: 'Khách hàng trả hàng', icon: CheckCircle, permission: 'sales:return:view' },
  { id: 'history', label: 'Lịch sử trả hàng', icon: History, permission: 'sales:return-history:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SalesReturnsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'requests';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Khách hàng Trả hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tiếp nhận yêu cầu trả hàng, thực hiện nhận lại hàng và tra cứu lịch sử trả hàng của khách
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
        {activeTab === 'requests' && (
          <RoleGuard requiredPermission="sales:return-request:view">
            <ReturnsListsPage />
          </RoleGuard>
        )}
        {activeTab === 'returns' && (
          <RoleGuard requiredPermission="sales:return:view">
            <CustomerReturnsPage />
          </RoleGuard>
        )}
        {activeTab === 'history' && (
          <RoleGuard requiredPermission="sales:return-history:view">
            <ReturnsHistoryPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SalesReturnsTabbedPage;
