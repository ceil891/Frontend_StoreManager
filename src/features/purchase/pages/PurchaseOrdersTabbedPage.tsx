import { useSearchParams } from 'react-router';
import { ShoppingCart, FileQuestion, MessageSquarePlus } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';
import { PurchaseRequestsPage } from './PurchaseRequestsPage';
import { SupplierRequestsPage } from './SupplierRequestsPage';

const tabs = [
  { id: 'orders', label: 'Đơn mua hàng', icon: ShoppingCart, permission: 'purchase:order:view' },
  { id: 'requests', label: 'Yêu cầu mua hàng nội bộ', icon: FileQuestion, permission: 'purchase:request:view' },
  { id: 'supplier-requests', label: 'Yêu cầu từ Nhà cung cấp', icon: MessageSquarePlus, permission: 'purchase:supplier-request:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function PurchaseOrdersTabbedPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn mua hàng & Đề xuất</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý phiếu đặt hàng mua, yêu cầu đề xuất nhập hàng nội bộ và đề xuất phía NCC
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
          <RoleGuard requiredPermission="purchase:order:view">
            <PurchaseOrdersPage />
          </RoleGuard>
        )}
        {activeTab === 'requests' && (
          <RoleGuard requiredPermission="purchase:request:view">
            <PurchaseRequestsPage />
          </RoleGuard>
        )}
        {activeTab === 'supplier-requests' && (
          <RoleGuard requiredPermission="purchase:supplier-request:view">
            <SupplierRequestsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrdersTabbedPage;
