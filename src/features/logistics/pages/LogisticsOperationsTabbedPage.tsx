import { useSearchParams } from 'react-router';
import { Route, Car, Banknote } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ShippingMethodsPage } from './ShippingMethodsPage';
import { VehiclesPage } from './VehiclesPage';
import { CodReconciliationPage } from './CodReconciliationPage';

const tabs = [
  { id: 'methods', label: 'Phương thức vận chuyển', icon: Route, permission: 'logistics:method:view' },
  { id: 'vehicles', label: 'Đội xe & phương tiện', icon: Car, permission: 'logistics:vehicle:view' },
  { id: 'cod', label: 'Đối soát tiền COD', icon: Banknote, permission: 'logistics:cod:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function LogisticsOperationsTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'methods';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vận hành giao vận & COD</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập hình thức giao hàng, quản lý phương tiện vận chuyển và đối soát dòng tiền thu hộ COD
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
        {activeTab === 'methods' && (
          <RoleGuard requiredPermission="logistics:method:view">
            <ShippingMethodsPage />
          </RoleGuard>
        )}
        {activeTab === 'vehicles' && (
          <RoleGuard requiredPermission="logistics:vehicle:view">
            <VehiclesPage />
          </RoleGuard>
        )}
        {activeTab === 'cod' && (
          <RoleGuard requiredPermission="logistics:cod:view">
            <CodReconciliationPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default LogisticsOperationsTabbedPage;
