import { useState } from 'react';
import { StorageAreasPage } from './StorageAreasPage';
import { WarehouseAreasPage } from './WarehouseAreasPage';
import { WarehouseZonesPage } from './WarehouseZonesPage';
import { WarehouseBinsPage } from './WarehouseBinsPage';
import { MapPin, Store, Grid, Layers } from 'lucide-react';

export function LocationsPage() {
  const [activeTab, setActiveTab] = useState<'storage-areas' | 'warehouse-areas' | 'zones' | 'bins'>('storage-areas');

  const tabs = [
    { id: 'storage-areas', label: 'Khu vực lưu trữ', icon: MapPin },
    { id: 'warehouse-areas', label: 'Vị trí kho', icon: Store },
    { id: 'zones', label: 'Phân khu (Zone)', icon: Grid },
    { id: 'bins', label: 'Ô kệ (Bin)', icon: Layers },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sơ đồ Kho & Vị trí (WMS)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý khu vực, vị trí, phân khu và ô kệ lưu trữ trong hệ thống kho hàng
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
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
        {activeTab === 'storage-areas' && <StorageAreasPage />}
        {activeTab === 'warehouse-areas' && <WarehouseAreasPage />}
        {activeTab === 'zones' && <WarehouseZonesPage />}
        {activeTab === 'bins' && <WarehouseBinsPage />}
      </div>
    </div>
  );
}

export default LocationsPage;
