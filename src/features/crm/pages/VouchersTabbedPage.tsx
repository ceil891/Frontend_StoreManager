import { useSearchParams } from 'react-router';
import { VouchersPage } from './VouchersPage';
import { CustomerVouchersPage } from './CustomerVouchersPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { Percent, Ticket } from 'lucide-react';

const tabs = [
  { id: 'vouchers', label: 'Chương trình Voucher', icon: Percent, permission: 'crm:voucher:view' },
  { id: 'customer-vouchers', label: 'Voucher của Khách hàng', icon: Ticket, permission: 'crm:customer-voucher:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function VouchersTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'vouchers';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mã giảm giá & Voucher</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập các chương trình khuyến mãi Voucher và theo dõi mã giảm giá do khách hàng nắm giữ
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
        {activeTab === 'vouchers' && (
          <RoleGuard requiredPermission="crm:voucher:view">
            <VouchersPage />
          </RoleGuard>
        )}
        {activeTab === 'customer-vouchers' && (
          <RoleGuard requiredPermission="crm:customer-voucher:view">
            <CustomerVouchersPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default VouchersTabbedPage;
