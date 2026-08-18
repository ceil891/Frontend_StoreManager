import { useSearchParams } from 'react-router';
import { Landmark, Wallet } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { BankAccountsPage } from './BankAccountsPage';
import { FundBalancesPage } from './FundBalancesPage';

const tabs = [
  { id: 'banks', label: 'Tài khoản Ngân hàng', icon: Landmark, permission: 'finance:bank:view' },
  { id: 'balances', label: 'Quỹ tiền mặt & Số dư', icon: Wallet, permission: 'finance:fund-balance:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function FinanceFundCashTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'banks';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Ngân hàng & Tồn quỹ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tài khoản ngân hàng, dòng tiền và số dư tồn quỹ tiền mặt
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
        {activeTab === 'banks' && (
          <RoleGuard requiredPermission="finance:bank:view">
            <BankAccountsPage />
          </RoleGuard>
        )}
        {activeTab === 'balances' && (
          <RoleGuard requiredPermission="finance:fund-balance:view">
            <FundBalancesPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default FinanceFundCashTabbedPage;
