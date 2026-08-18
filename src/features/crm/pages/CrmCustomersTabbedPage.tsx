import { useSearchParams } from 'react-router';
import { Users, Users2, MapPin } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { CustomersPage } from './CustomersPage';
import { PartnerGroupsPage } from './PartnerGroupsPage';
import { AreasPage } from './AreasPage';

const tabs = [
  { id: 'customers', label: 'Danh sách Khách hàng', icon: Users, permission: 'crm:customer:view' },
  { id: 'groups', label: 'Nhóm đối tác', icon: Users2, permission: 'crm:partner-group:view' },
  { id: 'areas', label: 'Khu vực địa lý', icon: MapPin, permission: 'crm:area:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function CrmCustomersTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'customers';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Khách hàng & Phân vùng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý cơ sở dữ liệu khách hàng, phân nhóm đối tác và phân vùng khu vực địa lý
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
        {activeTab === 'customers' && (
          <RoleGuard requiredPermission="crm:customer:view">
            <CustomersPage />
          </RoleGuard>
        )}
        {activeTab === 'groups' && (
          <RoleGuard requiredPermission="crm:partner-group:view">
            <PartnerGroupsPage />
          </RoleGuard>
        )}
        {activeTab === 'areas' && (
          <RoleGuard requiredPermission="crm:area:view">
            <AreasPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default CrmCustomersTabbedPage;
