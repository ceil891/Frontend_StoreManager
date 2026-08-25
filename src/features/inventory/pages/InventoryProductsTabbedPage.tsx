import { useSearchParams } from 'react-router';
import { Package, Layers, FolderTree, Boxes, FileSpreadsheet } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { InventoryPage } from './InventoryPage';
import { ProductVariantsPage } from './ProductVariantsPage';
import { CategoriesPage } from './CategoriesPage';
import { CombosPage } from './CombosPage';
import { ProductExcelImportPage } from './ProductExcelImportPage';

const tabs = [
  { id: 'products', label: 'Sản phẩm', icon: Package, permission: 'catalog:product:view' },
  { id: 'import-excel', label: 'Nhập từ Excel', icon: FileSpreadsheet, permission: 'catalog:product:create' },
  { id: 'variants', label: 'Biến thể sản phẩm', icon: Layers, permission: 'inventory:variant:view' },
  { id: 'categories', label: 'Danh mục sản phẩm', icon: FolderTree, permission: 'catalog:category:view' },
  { id: 'combos', label: 'Gói combo', icon: Boxes, permission: 'catalog:combo:view' },
] as const;


type TabId = typeof tabs[number]['id'];

export function InventoryProductsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'products';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý sản phẩm & danh mục</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý danh sách sản phẩm, biến thể mẫu mã, phân loại danh mục và các gói sản phẩm combo
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
        {activeTab === 'products' && (
          <RoleGuard requiredPermission="catalog:product:view">
            <InventoryPage />
          </RoleGuard>
        )}
        {activeTab === 'import-excel' && (
          <RoleGuard requiredPermission="catalog:product:create">
            <ProductExcelImportPage />
          </RoleGuard>
        )}
        {activeTab === 'variants' && (

          <RoleGuard requiredPermission="inventory:variant:view">
            <ProductVariantsPage />
          </RoleGuard>
        )}
        {activeTab === 'categories' && (
          <RoleGuard requiredPermission="catalog:category:view">
            <CategoriesPage />
          </RoleGuard>
        )}
        {activeTab === 'combos' && (
          <RoleGuard requiredPermission="catalog:combo:view">
            <CombosPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryProductsTabbedPage;
