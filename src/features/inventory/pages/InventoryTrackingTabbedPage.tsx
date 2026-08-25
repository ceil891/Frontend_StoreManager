import { useSearchParams } from 'react-router';
import { QrCode, Barcode } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ProductBatchesPage } from './ProductBatchesPage';
import { SerialNumbersPage } from './SerialNumbersPage';

const tabs = [
  { id: 'batches', label: 'Quản lý lô sản phẩm', icon: QrCode, permission: 'inventory:batch:view' },
  { id: 'serials', label: 'Số Serial / IMEI', icon: Barcode, permission: 'inventory:serial:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function InventoryTrackingTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'batches';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Truy xuất nguồn gốc & định danh</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý lô sản xuất, hạn sử dụng và định danh chính xác theo mã Serial / IMEI
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
                  ? 'border-primary text-primary'
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
        {activeTab === 'batches' && (
          <RoleGuard requiredPermission="inventory:batch:view">
            <ProductBatchesPage />
          </RoleGuard>
        )}
        {activeTab === 'serials' && (
          <RoleGuard requiredPermission="inventory:serial:view">
            <SerialNumbersPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryTrackingTabbedPage;
