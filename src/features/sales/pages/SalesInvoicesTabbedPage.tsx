import { useSearchParams } from 'react-router';
import { ExportInvoicesPage } from './ExportInvoicesPage';
import { SalesInvoicesPage } from './SalesInvoicesPage';
import { InvoiceListsPage } from './InvoiceListsPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { ClipboardList, FileText, ListOrdered } from 'lucide-react';

const tabs = [
  { id: 'export', label: 'Xuất Hóa đơn bán', icon: ClipboardList, permission: 'sales:invoice:view' },
  { id: 'retail', label: 'Danh sách Hóa đơn bán lẻ', icon: FileText, permission: 'sales:invoice-retail:view' },
  { id: 'list', label: 'Bảng kê Hóa đơn', icon: ListOrdered, permission: 'sales:invoice-list:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SalesInvoicesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'export';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Hóa đơn Bán hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi hóa đơn xuất kho, hóa đơn bán lẻ và bảng kê chi tiết hóa đơn
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
        {activeTab === 'export' && (
          <RoleGuard requiredPermission="sales:invoice:view">
            <ExportInvoicesPage />
          </RoleGuard>
        )}
        {activeTab === 'retail' && (
          <RoleGuard requiredPermission="sales:invoice-retail:view">
            <SalesInvoicesPage />
          </RoleGuard>
        )}
        {activeTab === 'list' && (
          <RoleGuard requiredPermission="sales:invoice-list:view">
            <InvoiceListsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SalesInvoicesTabbedPage;
