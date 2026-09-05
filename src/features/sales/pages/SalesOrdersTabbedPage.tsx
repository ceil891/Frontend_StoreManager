import { useSearchParams } from 'react-router';
import { ShoppingBag, Globe, FileText, Tag } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SaleOrdersPage } from './SaleOrdersPage';
import { OnlineOrdersPage } from './OnlineOrdersPage';
import { QuotesPage } from './QuotesPage';
import { SaleOffersPage } from './SaleOffersPage';

const tabs = [
  { id: 'orders', label: 'Đơn hàng bán', icon: ShoppingBag, permission: 'sales:order:view' },
  { id: 'online', label: 'Đơn hàng Online', icon: Globe, permission: 'sales:online-order:view' },
  { id: 'quotes', label: 'Báo giá', icon: FileText, permission: 'sales:quote:view' },
  { id: 'offers', label: 'Ưu đãi / Chào hàng', icon: Tag, permission: 'sales:offer:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SalesOrdersTabbedPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Đơn hàng Bán</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tổng hợp xử lý đơn hàng bán tại cửa hàng, đơn online, báo giá và chào hàng
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
          <RoleGuard requiredPermission="sales:order:view">
            <SaleOrdersPage />
          </RoleGuard>
        )}
        {activeTab === 'online' && (
          <RoleGuard requiredPermission="sales:online-order:view">
            <OnlineOrdersPage />
          </RoleGuard>
        )}
        {activeTab === 'quotes' && (
          <RoleGuard requiredPermission="sales:quote:view">
            <QuotesPage />
          </RoleGuard>
        )}
        {activeTab === 'offers' && (
          <RoleGuard requiredPermission="sales:offer:view">
            <SaleOffersPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SalesOrdersTabbedPage;
