import { useSearchParams } from 'react-router';
import { BookOpen, ListTree, Receipt, HelpCircle } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { JournalEntriesPage } from './JournalEntriesPage';
import ChartOfAccountsPage from './ChartOfAccountsPage';
import { TaxDutiesPage } from './TaxDutiesPage';
import { TransactionReasonsPage } from './TransactionReasonsPage';

const tabs = [
  { id: 'journal', label: 'Bút toán Sổ nhật ký', icon: BookOpen, permission: 'finance:journal:view' },
  { id: 'coa', label: 'Hệ thống Tài khoản (COA)', icon: ListTree, permission: 'finance:chart-of-accounts:view' },
  { id: 'tax', label: 'Thuế & Nghĩa vụ tài chính', icon: Receipt, permission: 'finance:tax-duty:view' },
  { id: 'reasons', label: 'Lý do Giao dịch Thu/Chi', icon: HelpCircle, permission: 'finance:transaction-reason:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function FinanceAccountingTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'journal';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kế toán & Cấu hình Tài chính</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý bút toán nhật ký, tài khoản kế toán, nghĩa vụ thuế và lý do giao dịch thu/chi
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
        {activeTab === 'journal' && (
          <RoleGuard requiredPermission="finance:journal:view">
            <JournalEntriesPage />
          </RoleGuard>
        )}
        {activeTab === 'coa' && (
          <RoleGuard requiredPermission="finance:chart-of-accounts:view">
            <ChartOfAccountsPage />
          </RoleGuard>
        )}
        {activeTab === 'tax' && (
          <RoleGuard requiredPermission="finance:tax-duty:view">
            <TaxDutiesPage />
          </RoleGuard>
        )}
        {activeTab === 'reasons' && (
          <RoleGuard requiredPermission="finance:transaction-reason:view">
            <TransactionReasonsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default FinanceAccountingTabbedPage;
