import { useSearchParams } from 'react-router';
import { CreditCard, History } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ReceivablesPage } from './ReceivablesPage';
import { SalesPaymentsPage } from './SalesPaymentsPage';

const tabs = [
  { id: 'receivables', label: 'Phải thu bán hàng', icon: CreditCard, permission: 'sales:receivable:view' },
  { id: 'payments', label: 'Lịch sử thanh toán', icon: History, permission: 'sales:payment:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SalesReceivablesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'receivables';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Phải thu Bán hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi nợ phải thu của khách hàng và lịch sử thu tiền thanh toán đơn hàng
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
        {activeTab === 'receivables' && (
          <RoleGuard requiredPermission="sales:receivable:view">
            <ReceivablesPage />
          </RoleGuard>
        )}
        {activeTab === 'payments' && (
          <RoleGuard requiredPermission="sales:payment:view">
            <SalesPaymentsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SalesReceivablesTabbedPage;
