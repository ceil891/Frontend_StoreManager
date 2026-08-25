import { useSearchParams } from 'react-router';
import { Database, Archive, Warehouse, Truck } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { StockKeepingPage } from './StockKeepingPage';
import { ProductInStoragesPage } from './ProductInStoragesPage';
import { ProductWarehousesPage } from './ProductWarehousesPage';
import { SupplierProductsPage } from './SupplierProductsPage';

const tabs = [
  { id: 'stock-keeping', label: 'Tồn kho thực tế', icon: Database, permission: 'inventory:stock-keeping:view' },
  { id: 'storages', label: 'Tồn kho vị trí', icon: Archive, permission: 'inventory:product-storage:view' },
  { id: 'warehouses', label: 'Tồn kho theo nhà kho', icon: Warehouse, permission: 'inventory:product-warehouse:view' },
  { id: 'supplier-products', label: 'Tồn kho nhà cung cấp', icon: Truck, permission: 'inventory:supplier-product:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function InventoryStockStatusTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'stock-keeping';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trạng thái tồn kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi định mức tồn kho thực tế, tồn kho theo khu vực lưu trữ, nhà kho và nhà cung cấp
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
        {activeTab === 'stock-keeping' && (
          <RoleGuard requiredPermission="inventory:stock-keeping:view">
            <StockKeepingPage />
          </RoleGuard>
        )}
        {activeTab === 'storages' && (
          <RoleGuard requiredPermission="inventory:product-storage:view">
            <ProductInStoragesPage />
          </RoleGuard>
        )}
        {activeTab === 'warehouses' && (
          <RoleGuard requiredPermission="inventory:product-warehouse:view">
            <ProductWarehousesPage />
          </RoleGuard>
        )}
        {activeTab === 'supplier-products' && (
          <RoleGuard requiredPermission="inventory:supplier-product:view">
            <SupplierProductsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryStockStatusTabbedPage;
