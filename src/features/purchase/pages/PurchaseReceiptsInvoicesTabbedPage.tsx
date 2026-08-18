import { useSearchParams } from 'react-router';
import { PackageCheck, ClipboardList } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SupplierDeliveriesPage } from './SupplierDeliveriesPage';
import { PurchaseInvoicesPage } from './PurchaseInvoicesPage';

const tabs = [
  { id: 'receipts', label: 'Nhận hàng nhà cung cấp', icon: PackageCheck, permission: 'purchase:delivery:view' },
  { id: 'invoices', label: 'Hóa đơn mua hàng (nguồn vào)', icon: ClipboardList, permission: 'purchase:invoice:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function PurchaseReceiptsInvoicesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'receipts';

  const handleTabChange = (tabId: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-7 h-7 text-emerald-600" />
            Nhận hàng & Hóa đơn Mua hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý đợt giao nhận hàng thực tế kho (WMS Goods Receipts) và quản lý hóa đơn mua hàng nguồn vào (Supplier Invoices).
          </p>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'receipts' && (
          <RoleGuard requiredPermission="purchase:delivery:view">
            <SupplierDeliveriesPage />
          </RoleGuard>
        )}
        {activeTab === 'invoices' && (
          <RoleGuard requiredPermission="purchase:invoice:view">
            <PurchaseInvoicesPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default PurchaseReceiptsInvoicesTabbedPage;
