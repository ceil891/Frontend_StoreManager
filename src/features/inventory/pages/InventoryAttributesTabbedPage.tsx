import { useSearchParams } from 'react-router';
import { Scale, Palette, Maximize2 } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { UnitsPage } from './UnitsPage';
import { ColorsPage } from './ColorsPage';
import { SizesPage } from './SizesPage';

const tabs = [
  { id: 'units', label: 'Đơn vị tính', icon: Scale, permission: 'catalog:unit:view' },
  { id: 'colors', label: 'Màu sắc', icon: Palette, permission: 'catalog:color:view' },
  { id: 'sizes', label: 'Kích thước', icon: Maximize2, permission: 'catalog:size:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function InventoryAttributesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'units';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thuộc tính sản phẩm</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý danh mục đơn vị tính, bảng màu sắc và kích thước sản phẩm
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
        {activeTab === 'units' && (
          <RoleGuard requiredPermission="catalog:unit:view">
            <UnitsPage />
          </RoleGuard>
        )}
        {activeTab === 'colors' && (
          <RoleGuard requiredPermission="catalog:color:view">
            <ColorsPage />
          </RoleGuard>
        )}
        {activeTab === 'sizes' && (
          <RoleGuard requiredPermission="catalog:size:view">
            <SizesPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryAttributesTabbedPage;
