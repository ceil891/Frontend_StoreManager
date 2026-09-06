import { useSearchParams } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, FileQuestion, Sliders, CheckSquare, CornerUpLeft, Trash2 } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ImportReceiptsPage } from './ImportReceiptsPage';
import { StockOutsPage } from './StockOutsPage';
import { StockTransferPage } from './StockTransferPage';
import { StockTransferRequestsPage } from './StockTransferRequestsPage';
import { InventoryAdjustmentsPage } from './InventoryAdjustmentsPage';
import { InventoryCheckPage } from './InventoryCheckPage';
import { ReturnToSupplierPage } from './ReturnToSupplierPage';
import { CancelIssuePage } from './CancelIssuePage';

const tabs = [
  { id: 'imports', label: 'Nhập kho', icon: ArrowDownLeft, permission: 'inventory:import:view' },
  { id: 'stock-outs', label: 'Xuất kho', icon: ArrowUpRight, permission: 'inventory:stock-out:view' },
  { id: 'transfers', label: 'Chuyển kho', icon: ArrowRightLeft, permission: 'inventory:transfer:view' },
  { id: 'transfer-requests', label: 'Yêu cầu chuyển kho', icon: FileQuestion, permission: 'inventory:transfer-request:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function InventoryOperationsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'imports';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thao tác & nghiệp vụ kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các nghiệp vụ nhập kho, xuất kho, điều chuyển kho và phê duyệt yêu cầu chuyển kho
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
        {activeTab === 'imports' && (
          <RoleGuard requiredPermission="inventory:import:view">
            <ImportReceiptsPage />
          </RoleGuard>
        )}
        {activeTab === 'stock-outs' && (
          <RoleGuard requiredPermission="inventory:stock-out:view">
            <StockOutsPage />
          </RoleGuard>
        )}
        {activeTab === 'transfers' && (
          <RoleGuard requiredPermission="inventory:transfer:view">
            <StockTransferPage />
          </RoleGuard>
        )}
        {activeTab === 'transfer-requests' && (
          <RoleGuard requiredPermission="inventory:transfer-request:view">
            <StockTransferRequestsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryOperationsTabbedPage;
