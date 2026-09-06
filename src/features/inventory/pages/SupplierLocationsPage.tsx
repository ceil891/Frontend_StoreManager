import { useState } from 'react';
import { SupplierStoragesPage } from './SupplierStoragesPage';
import { SupplierWarehousesPage } from './SupplierWarehousesPage';
import { Layers, Store } from 'lucide-react';

export function SupplierLocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Điểm kho nhà cung cấp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin điểm kho bãi nhận và giao nhận của các đối tác nhà cung cấp
          </p>
        </div>
      </div>

      <div>
        <SupplierStoragesPage />
      </div>
    </div>
  );
}

export default SupplierLocationsPage;
