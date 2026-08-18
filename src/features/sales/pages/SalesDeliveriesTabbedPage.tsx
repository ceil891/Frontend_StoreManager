import { useSearchParams } from 'react-router';
import { DeliveryListsPage } from './DeliveryListsPage';
import { DeliveryNotesPage } from './DeliveryNotesPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { PackageCheck, FileText } from 'lucide-react';

const tabs = [
  { id: 'notes', label: 'Biên bản giao nhận', icon: FileText, permission: 'sales:delivery-note:view' },
  { id: 'lists', label: 'Phiếu xuất giao hàng', icon: PackageCheck, permission: 'sales:delivery-list:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function SalesDeliveriesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'notes';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giao nhận & Xuất hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý phiếu xuất giao hàng và biên bản giao nhận sản phẩm cho khách
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
        {activeTab === 'notes' && (
          <RoleGuard requiredPermission="sales:delivery-note:view">
            <DeliveryNotesPage />
          </RoleGuard>
        )}
        {activeTab === 'lists' && (
          <RoleGuard requiredPermission="sales:delivery-list:view">
            <DeliveryListsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default SalesDeliveriesTabbedPage;
