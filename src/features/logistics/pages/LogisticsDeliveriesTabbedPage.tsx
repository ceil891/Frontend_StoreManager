import { useSearchParams } from 'react-router';
import { Truck, FileCheck, FileText } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { ShipmentsPage } from './ShipmentsPage';
import DeliveryNotesPageLogistics from './DeliveryNotesPage';
import { ShippingNotesPage } from './ShippingNotesPage';

const tabs = [
  { id: 'shipments', label: 'Danh sách Vận đơn', icon: Truck, permission: 'logistics:shipment:view' },
  { id: 'delivery-notes', label: 'Phiếu giao hàng / POD', icon: FileCheck, permission: 'logistics:delivery-note:view' },
  { id: 'notes', label: 'Ghi chú giao hàng', icon: FileText, permission: 'logistics:note:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function LogisticsDeliveriesTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'shipments';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Vận đơn & Giao hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi trạng thái hành trình vận đơn, xác nhận giao hàng (POD) và xử lý sự cố ghi chú giao
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
        {activeTab === 'shipments' && (
          <RoleGuard requiredPermission="logistics:shipment:view">
            <ShipmentsPage />
          </RoleGuard>
        )}
        {activeTab === 'delivery-notes' && (
          <RoleGuard requiredPermission="logistics:delivery-note:view">
            <DeliveryNotesPageLogistics />
          </RoleGuard>
        )}
        {activeTab === 'notes' && (
          <RoleGuard requiredPermission="logistics:note:view">
            <ShippingNotesPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default LogisticsDeliveriesTabbedPage;
