import { useSearchParams } from 'react-router';
import { Share2, Link2, Terminal } from 'lucide-react';
import { RoleGuard } from '@/routes/RoleGuard';
import { SalesChannelsPage } from './SalesChannelsPage';
import { ChannelProductMappingPage } from './ChannelProductMappingPage';
import { WebhookLogsPage } from './WebhookLogsPage';

const tabs = [
  { id: 'channels', label: 'Kênh bán hàng', icon: Share2, permission: 'omnichannel:channel:view' },
  { id: 'mapping', label: 'Liên kết SKU & Sản phẩm', icon: Link2, permission: 'omnichannel:mapping:view' },
  { id: 'webhooks', label: 'Nhật ký Webhook', icon: Terminal, permission: 'omnichannel:webhook:view' },
] as const;

type TabId = typeof tabs[number]['id'];

export function OmnichannelTabbedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as TabId | null;
  const activeTab = tabs.some(t => t.id === activeTabParam) ? (activeTabParam as TabId) : 'channels';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bán hàng Đa kênh</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý kết nối các sàn thương mại điện tử (Shopee, TikTok Shop, Lazada), đồng bộ kho và nhật ký webhook
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
        {activeTab === 'channels' && (
          <RoleGuard requiredPermission="omnichannel:channel:view">
            <SalesChannelsPage />
          </RoleGuard>
        )}
        {activeTab === 'mapping' && (
          <RoleGuard requiredPermission="omnichannel:mapping:view">
            <ChannelProductMappingPage />
          </RoleGuard>
        )}
        {activeTab === 'webhooks' && (
          <RoleGuard requiredPermission="omnichannel:webhook:view">
            <WebhookLogsPage />
          </RoleGuard>
        )}
      </div>
    </div>
  );
}

export default OmnichannelTabbedPage;
