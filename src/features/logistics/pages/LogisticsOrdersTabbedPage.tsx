import { useSearchParams } from 'react-router';
import { Package, Layers, ClipboardList } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ShippingOrdersPage } from './ShippingOrdersPage';
import { ShippingOrderBatchesPage } from './ShippingOrderBatchesPage';
import { PackingListsPage } from './PackingListsPage';

const tabs = [
  { id: 'orders', label: 'Đơn chờ giao', icon: Package, permission: 'logistics:order:view' },
  { id: 'batches', label: 'Gom đợt giao hàng', icon: Layers, permission: 'logistics:batch:view' },
  { id: 'packing-lists', label: 'Danh sách đóng gói', icon: ClipboardList, permission: 'logistics:packing-list:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function LogisticsOrdersTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'orders';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn hàng vận chuyển & đóng gói</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tiếp nhận đơn chờ giao, xử lý gom đợt đóng gói xuất hàng hàng loạt
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
        {activeTab === 'orders' && (
          <RoleGuard requiredPermission="logistics:order:view">
            <ShippingOrdersPage />
          </RoleGuard>
        )}
        {activeTab === 'batches' && (
          <RoleGuard requiredPermission="logistics:batch:view">
            <ShippingOrderBatchesPage />
          </RoleGuard>
        )}
        {activeTab === 'packing-lists' && (
          <RoleGuard requiredPermission="logistics:packing-list:view">
            <PackingListsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default LogisticsOrdersTabbedPage;
