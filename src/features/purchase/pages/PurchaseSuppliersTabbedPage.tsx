import { useSearchParams } from 'react-router';
import { Building2, FileCheck2, Award } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SuppliersPage } from './SuppliersPage';
import { SupplierContractsPage } from './SupplierContractsPage';
import { SupplierEvaluationsPage } from './SupplierEvaluationsPage';

const tabs = [
  { id: 'suppliers', label: 'Danh mục nhà cung cấp', icon: Building2, permission: 'purchase:supplier:view' },
  { id: 'contracts', label: 'Hợp đồng NCC (Supplier Contract)', icon: FileCheck2, permission: 'purchase:contract:view' },
  { id: 'evaluations', label: 'Đánh giá NCC (Vendor Evaluation)', icon: Award, permission: 'purchase:evaluation:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function PurchaseSuppliersTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'suppliers';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Nhà cung cấp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý hồ sơ Nhà cung cấp, hợp đồng cung ứng và đánh giá xếp hạng đối tác
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
        {activeTab === 'suppliers' && (
          <RoleGuard requiredPermission="purchase:supplier:view">
            <SuppliersPage />
          </RoleGuard>
        )}
        {activeTab === 'contracts' && (
          <RoleGuard requiredPermission="purchase:contract:view">
            <SupplierContractsPage />
          </RoleGuard>
        )}
        {activeTab === 'evaluations' && (
          <RoleGuard requiredPermission="purchase:evaluation:view">
            <SupplierEvaluationsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default PurchaseSuppliersTabbedPage;
