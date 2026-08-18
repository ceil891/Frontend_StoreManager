import { useSearchParams } from 'react-router';
import { MapPin, Warehouse, Grid, Box, Truck, Building2, Layers } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { StorageAreasPage } from './StorageAreasPage';
import { WarehouseAreasPage } from './WarehouseAreasPage';
import { WarehouseZonesPage } from './WarehouseZonesPage';
import { WarehouseBinsPage } from './WarehouseBinsPage';
import { SupplierLocationsPage } from './SupplierLocationsPage';

const tabGroups = [
  {
    groupName: 'Cơ sở Kho (Warehouses)',
    groupIcon: Building2,
    items: [
      { id: 'stores', label: 'Kho Cửa hàng / Nội bộ', icon: MapPin, permission: 'inventory:storage-area:view' },
      { id: 'suppliers', label: 'Kho Nhà cung cấp', icon: Truck, permission: 'inventory:supplier-storage:view' },
    ],
  },
  {
    groupName: 'Cấu trúc Vị trí WMS (Location Hierarchy)',
    groupIcon: Layers,
    items: [
      { id: 'warehouses', label: 'Khu vực kho (Zone)', icon: Warehouse, permission: 'inventory:storage-area:view' },
      { id: 'zones', label: 'Dãy kho (Rack)', icon: Grid, permission: 'inventory:storage-area:view' },
      { id: 'bins', label: 'Ô / Kệ kho (Bin)', icon: Box, permission: 'inventory:storage-area:view' },
    ],
  },
] as const;

type TabId = 'stores' | 'suppliers' | 'warehouses' | 'zones' | 'bins';

export function InventoryLocationsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const allTabIds: TabId[] = ['stores', 'suppliers', 'warehouses', 'zones', 'bins'];
  const activeTab: TabId = allTabIds.includes(activeTabParam as TabId) ? (activeTabParam as TabId) : 'stores';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sơ đồ & Vị trí Kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý cơ sở kho (Kho cửa hàng, Kho nhà cung cấp) và cấu trúc vị trí chi tiết (Khu vực, Dãy, Ô/Kệ)
          </p>
        </div>
      </div>

      {/* Grouped Tabs Header */}
      <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between">
        {tabGroups.map((group, groupIdx) => {
          const GroupIcon = group.groupIcon;
          return (
            <div key={group.groupName} className={`flex-1 ${groupIdx > 0 ? 'md:border-l md:border-gray-200 dark:md:border-gray-800 md:pl-4' : ''}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                <GroupIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>{group.groupName}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as TabId)}
                      className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200 dark:border-gray-700 font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'stores' && (
          <RoleGuard requiredPermission="inventory:storage-area:view">
            <StorageAreasPage />
          </RoleGuard>
        )}
        {activeTab === 'suppliers' && (
          <RoleGuard requiredPermission="inventory:supplier-storage:view">
            <SupplierLocationsPage />
          </RoleGuard>
        )}
        {activeTab === 'warehouses' && (
          <RoleGuard requiredPermission="inventory:storage-area:view">
            <WarehouseAreasPage />
          </RoleGuard>
        )}
        {activeTab === 'zones' && (
          <RoleGuard requiredPermission="inventory:storage-area:view">
            <WarehouseZonesPage />
          </RoleGuard>
        )}
        {activeTab === 'bins' && (
          <RoleGuard requiredPermission="inventory:storage-area:view">
            <WarehouseBinsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryLocationsTabbedPage;
