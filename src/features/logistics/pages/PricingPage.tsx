import { useSearchParams } from 'react-router';
import { PriceListsPage } from './PriceListsPage';
import { ShippingFeesPage } from './ShippingFeesPage';
import { ShippingFeeRatesPage } from './ShippingFeeRatesPage';
import { ShippingFeeGroupsPage } from './ShippingFeeGroupsPage';
import { ShippingChargesPage } from './ShippingChargesPage';
import { PromotionsPage } from './PromotionsPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { DollarSign, Settings, Activity, Layers, CreditCard, Percent } from 'lucide-react';

const tabs = [
  { id: 'lists', label: 'Bảng giá cước', icon: DollarSign, permission: 'logistics:price:view' },
  { id: 'promotions', label: 'Khuyến mãi phí', icon: Percent, permission: 'logistics:promotion:view' },
  { id: 'fees', label: 'Cấu hình phí giao hàng', icon: Settings, permission: 'logistics:fee:view' },
  { id: 'fee-rates', label: 'Tỷ lệ cước', icon: Activity, permission: 'logistics:fee-rate:view' },
  { id: 'fee-groups', label: 'Nhóm phí giao hàng', icon: Layers, permission: 'logistics:fee-group:view' },
  { id: 'charges', label: 'Phụ phí giao hàng', icon: CreditCard, permission: 'logistics:charge:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'lists';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giá cước & phụ phí vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tập trung bảng giá, các loại phí, tỷ lệ cước và chương trình khuyến mãi giao hàng
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
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
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
        {activeTab === 'lists' && (
          <RoleGuard requiredPermission="logistics:price:view">
            <PriceListsPage />
          </RoleGuard>
        )}
        {activeTab === 'promotions' && (
          <RoleGuard requiredPermission="logistics:promotion:view">
            <PromotionsPage />
          </RoleGuard>
        )}
        {activeTab === 'fees' && (
          <RoleGuard requiredPermission="logistics:fee:view">
            <ShippingFeesPage />
          </RoleGuard>
        )}
        {activeTab === 'fee-rates' && (
          <RoleGuard requiredPermission="logistics:fee-rate:view">
            <ShippingFeeRatesPage />
          </RoleGuard>
        )}
        {activeTab === 'fee-groups' && (
          <RoleGuard requiredPermission="logistics:fee-group:view">
            <ShippingFeeGroupsPage />
          </RoleGuard>
        )}
        {activeTab === 'charges' && (
          <RoleGuard requiredPermission="logistics:charge:view">
            <ShippingChargesPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default PricingPage;
