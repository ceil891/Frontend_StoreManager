import { useState } from 'react';
import { SupplierStoragesPage } from './SupplierStoragesPage';
import { SupplierWarehousesPage } from './SupplierWarehousesPage';
import { Layers, Store } from 'lucide-react';

export function SupplierLocationsPage() {
  const [activeTab, setActiveTab] = useState<'storages' | 'warehouses'>('storages');

  const tabs = [
    { id: 'storages', label: 'Điểm kho NCC', icon: Layers },
    { id: 'warehouses', label: 'Tổng kho NCC', icon: Store },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kho bãi nhà cung cấp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin điểm kho và tổng kho của các đối tác nhà cung cấp
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
        {activeTab === 'storages' && <SupplierStoragesPage />}
        {activeTab === 'warehouses' && <SupplierWarehousesPage />}
      </div>
    </div>
  );
}

export default SupplierLocationsPage;
