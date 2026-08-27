import { useSearchParams } from 'react-router';
import { LifeBuoy, MessageSquare, MessageCircleHeart } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SupportTicketsPage } from './SupportTicketsPage';
import TicketMessagesPage from './TicketMessagesPage';
import { FeedbackPage } from './FeedbackPage';

const tabs = [
  { id: 'tickets', label: 'Yêu cầu hỗ trợ', icon: LifeBuoy, permission: 'crm:ticket:view' },
  { id: 'messages', label: 'Tin nhắn trao đổi', icon: MessageSquare, permission: 'crm:ticket-message:view' },
  { id: 'feedback', label: 'Phản hồi khách hàng', icon: MessageCircleHeart, permission: 'crm:feedback:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function CrmSupportTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'tickets';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chăm sóc & hỗ trợ khách hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tiếp nhận phiếu hỗ trợ kỹ thuật/khiếu nại, tin nhắn tương tác và ý kiến phản hồi từ khách hàng
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
        {activeTab === 'tickets' && (
          <RoleGuard requiredPermission="crm:ticket:view">
            <SupportTicketsPage />
          </RoleGuard>
        )}
        {activeTab === 'messages' && (
          <RoleGuard requiredPermission="crm:ticket-message:view">
            <TicketMessagesPage />
          </RoleGuard>
        )}
        {activeTab === 'feedback' && (
          <RoleGuard requiredPermission="crm:feedback:view">
            <FeedbackPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default CrmSupportTabbedPage;
