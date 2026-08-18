import { useSearchParams } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, FileQuestion, ClipboardCheck, Sliders, CheckSquare, CornerUpLeft, Trash2 } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ImportReceiptsPage } from './ImportReceiptsPage';
import { StockOutsPage } from './StockOutsPage';
import { StockTransferPage } from './StockTransferPage';
import { StockTransferRequestsPage } from './StockTransferRequestsPage';
import { InventoryTransfersPage } from './InventoryTransfersPage';
import { InventoryAdjustmentsPage } from './InventoryAdjustmentsPage';
import { InventoryCheckPage } from './InventoryCheckPage';
import { ReturnToSupplierPage } from './ReturnToSupplierPage';
import { CancelIssuePage } from './CancelIssuePage';

const tabs = [
  { id: 'imports', label: 'Nhập kho', icon: ArrowDownLeft, permission: 'inventory:import:view' },
  { id: 'stock-outs', label: 'Xuất kho', icon: ArrowUpRight, permission: 'inventory:stock-out:view' },
  { id: 'transfers', label: 'Chuyển kho', icon: ArrowRightLeft, permission: 'inventory:transfer:view' },
  { id: 'transfer-requests', label: 'Yêu cầu chuyển kho', icon: FileQuestion, permission: 'inventory:transfer-request:view' },
  { id: 'transfers-list', label: 'Bảng kê chuyển kho', icon: ClipboardCheck, permission: 'inventory:transfer-list:view' },
  { id: 'adjustments', label: 'Điều chỉnh kho', icon: Sliders, permission: 'inventory:adjustment:view' },
  { id: 'checks', label: 'Kiểm kê kho', icon: CheckSquare, permission: 'inventory:check:view' },
  { id: 'cancel', label: 'Xuất hủy', icon: Trash2, permission: 'inventory:cancel:view' },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thao tác & Nghiệp vụ Kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các nghiệp vụ Nhập kho, Xuất kho, Chuyển kho, Điều chỉnh, Kiểm kê và Xuất hủy hàng hóa
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
        {activeTab === 'transfers-list' && (
          <RoleGuard requiredPermission="inventory:transfer-list:view">
            <InventoryTransfersPage />
          </RoleGuard>
        )}
        {activeTab === 'adjustments' && (
          <RoleGuard requiredPermission="inventory:adjustment:view">
            <InventoryAdjustmentsPage />
          </RoleGuard>
        )}
        {activeTab === 'checks' && (
          <RoleGuard requiredPermission="inventory:check:view">
            <InventoryCheckPage />
          </RoleGuard>
        )}
        {activeTab === 'cancel' && (
          <RoleGuard requiredPermission="inventory:cancel:view">
            <CancelIssuePage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default InventoryOperationsTabbedPage;
