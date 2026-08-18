import { useSearchParams } from 'react-router';
import { AttendancePage } from './AttendancePage';
import { LeaveRequestsPage } from './LeaveRequestsPage';
import { ShiftSwapRequestsPage } from './ShiftSwapRequestsPage';
import { RoleGuard } from '@/routes/RoleGuard';
import { Activity, FileText, ArrowLeftRight } from 'lucide-react';

const tabs = [
  { id: 'attendance', label: 'Bảng Chấm công', icon: Activity, permission: 'hrm:attendance:view' },
  { id: 'leave-requests', label: 'Đơn xin nghỉ phép', icon: FileText, permission: 'hr:leave-request:view' },
  { id: 'shift-swaps', label: 'Yêu cầu đổi ca', icon: ArrowLeftRight, permission: 'hr:shift-swap:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function TimekeepingTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'attendance';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chấm công & Nghỉ phép</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi dữ liệu chấm công, phê duyệt đơn xin nghỉ phép và yêu cầu đổi ca làm việc
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
        {activeTab === 'attendance' && (
          <RoleGuard requiredPermission="hrm:attendance:view">
            <AttendancePage />
          </RoleGuard>
        )}
        {activeTab === 'leave-requests' && (
          <RoleGuard requiredPermission="hr:leave-request:view">
            <LeaveRequestsPage />
          </RoleGuard>
        )}
        {activeTab === 'shift-swaps' && (
          <RoleGuard requiredPermission="hr:shift-swap:view">
            <ShiftSwapRequestsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default TimekeepingTabbedPage;
