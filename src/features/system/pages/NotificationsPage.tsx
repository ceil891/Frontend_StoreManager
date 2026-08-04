import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Bell, Send, Users, Mail, MessageSquare, Trash2, X, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useSystemStore, type NotificationRuleRecord } from '../store/systemStore';
import type { ColumnDef } from '@tanstack/react-table';

const urgencyBadgeStyles = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 animate-pulse',
  HIGH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
};

const channelBadgeStyles = {
  EMAIL: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
  SMS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200',
  PUSH_NOTIFICATION: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200',
  WEBHOOK_SLACK: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 font-mono',
};

type SearchField = 'all' | 'ruleCode' | 'eventName' | 'channel' | 'urgency';

export function NotificationsPage() {
  const { notifications, addNotificationRule, updateNotificationRule, deleteNotificationRule } = useSystemStore();

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedRule, setSelectedRule] = useState<NotificationRuleRecord | null>(null);

  // Filter states
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Omit<NotificationRuleRecord, 'id' | 'deliveryCountYtd' | 'lastDispatchedTimestamp'>>({
    ruleCode: '',
    eventName: '',
    channel: 'EMAIL',
    recipientRoleScope: 'ROLE-STORE-MGR',
    urgency: 'NORMAL',
    templateSubject: '',
    status: 'ACTIVE',
    templateBody: '',
  });

  // Action states
  const [deletingRule, setDeletingRule] = useState<NotificationRuleRecord | null>(null);
  const [simulatedDispatch, setSimulatedDispatch] = useState<NotificationRuleRecord | null>(null);

  const filtered = notifications.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'ruleCode':
          matchesSearch = item.ruleCode.toLowerCase().includes(q);
          break;
        case 'eventName':
          matchesSearch = item.eventName.toLowerCase().includes(q);
          break;
        case 'channel':
          matchesSearch = item.channel.toLowerCase().includes(q);
          break;
        case 'urgency':
          matchesSearch = item.urgency.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.ruleCode.toLowerCase().includes(q) ||
            item.eventName.toLowerCase().includes(q) ||
            item.channel.toLowerCase().includes(q) ||
            item.urgency.toLowerCase().includes(q)
          );
      }
    }

    // 2. Channel filter
    const matchesChannel = channelFilter === 'all' || item.channel === channelFilter;

    // 3. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notifications, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Notification_Rules_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      ruleCode: '',
      eventName: '',
      channel: 'EMAIL',
      recipientRoleScope: 'ROLE-STORE-MGR',
      urgency: 'NORMAL',
      templateSubject: '',
      status: 'ACTIVE',
      templateBody: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (rule: NotificationRuleRecord) => {
    setSelectedRule(null);
    setFormMode('edit');
    setFormData({
      ruleCode: rule.ruleCode,
      eventName: rule.eventName,
      channel: rule.channel,
      recipientRoleScope: rule.recipientRoleScope,
      urgency: rule.urgency,
      templateSubject: rule.templateSubject,
      status: rule.status,
      templateBody: rule.templateBody,
    });
    (window as any).__editingRuleId = rule.id;
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      deliveryCountYtd: 0,
      lastDispatchedTimestamp: 'Chưa gửi',
    };

    if (formMode === 'create') {
      addNotificationRule(payload);
    } else {
      const id = (window as any).__editingRuleId;
      if (id) {
        updateNotificationRule(id, formData);
      }
    }
    setFormOpen(false);
  };

  const handleDelete = (rule: NotificationRuleRecord) => {
    setDeletingRule(rule);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRule) return;
    deleteNotificationRule(deletingRule.id);
    setDeletingRule(null);
    setSelectedRule(null);
  };

  const handleTriggerSimulate = (rule: NotificationRuleRecord) => {
    setSimulatedDispatch(rule);
    setTimeout(() => {
      setSimulatedDispatch(null);
    }, 4500);
  };

  const columns = useMemo<ColumnDef<NotificationRuleRecord>[]>(
    () => [
      {
        accessorKey: 'ruleCode',
        header: 'Mã luật NTF',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'eventName',
        header: 'Sự kiện & tiêu đề cảnh báo',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.eventName}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.templateSubject}</p>
          </div>
        ),
      },
      {
        accessorKey: 'urgency',
        header: 'Độ khẩn cấp',
        cell: (info) => {
          const u = info.getValue() as keyof typeof urgencyBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${urgencyBadgeStyles[u]}`}>
              {u}
            </span>
          );
        },
      },
      {
        accessorKey: 'channel',
        header: 'Kênh truyền tải',
        cell: (info) => {
          const c = info.getValue() as keyof typeof channelBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${channelBadgeStyles[c]}`}>
              {c.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'recipientRoleScope',
        header: 'Đối tượng nhận',
        cell: (info) => <span className="font-mono text-xs text-gray-700 dark:text-gray-300 font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'deliveryCountYtd',
        header: 'Tần suất gửi (YTD)',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{((info.getValue() as number)).toLocaleString()} msgs</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PAUSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedRule(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem cấu hình chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sửa luật gửi"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Xóa luật gửi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Luật cảnh báo & gửi thông báo (event dispatcher)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Định nghĩa các sự kiện kích hoạt (Hết kho, Biến động két tiền POS, Giao dịch lớn) và thiết lập kênh phân phối tin nhắn tương ứng.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất tập tin telemetry (.json)
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Định nghĩa luật gửi mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả thông tin</option>
                <option value="ruleCode">Mã luật cảnh báo</option>
                <option value="eventName">Tên sự kiện kích hoạt</option>
                <option value="channel">Kênh gửi tin</option>
                <option value="urgency">Độ khẩn cấp</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm luật thông báo..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Kênh gửi:</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả kênh</option>
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
                <option value="IN_APP">IN APP</option>
                <option value="WEBHOOK_SLACK">SLACK</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {(channelFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setChannelFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedRule(row)} />
      </div>

      {/* VIEW MODAL */}
      <Modal
        isOpen={!!selectedRule}
        onClose={() => setSelectedRule(null)}
        title={selectedRule ? `Luật gửi cảnh báo: ${selectedRule.ruleCode}` : 'Chi tiết luật thiết lập'}
        width="max-w-2xl"
      >
        {selectedRule && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedRule.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedRule.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tần suất gửi tích lũy (YTD)</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedRule.deliveryCountYtd.toLocaleString()} lượt gửi thành công trong năm
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedRule.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {selectedRule.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Mail className="w-4 h-4 text-primary" /> Kênh truyền tải spooler
                </div>
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">{selectedRule.channel.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4 text-emerald-500" /> Đối tượng phân gán
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate font-mono">{selectedRule.recipientRoleScope}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Điều kiện sự kiện kích hoạt</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedRule.eventName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Độ khẩn cấp:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${urgencyBadgeStyles[selectedRule.urgency]}`}>
                    {selectedRule.urgency}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tiêu đề tiêu chuẩn tin nhắn (Subject)</span>
                <p className="text-sm font-semibold font-mono bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {selectedRule.templateSubject}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Cấu trúc nội dung tham chiếu (Body Template)</span>
                <pre className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {selectedRule.templateBody}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời điểm dispatch gần nhất:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedRule.lastDispatchedTimestamp}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleOpenEdit(selectedRule)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" /> Thay đổi cấu trúc Template
              </button>
              <button 
                onClick={() => handleTriggerSimulate(selectedRule)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Send className="w-4 h-4 inline mr-1" /> Kích hoạt Test Dispatch
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Tạo mới luật gửi thông báo cảnh báo' : 'Sửa đổi cấu trúc cảnh báo tự động'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã luật (Rule Code)</label>
              <input
                type="text"
                required
                disabled={formMode === 'edit'}
                placeholder="Ví dụ: NTF-STK-01"
                value={formData.ruleCode}
                onChange={(e) => setFormData(p => ({ ...p, ruleCode: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên sự kiện kích hoạt</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Cảnh báo số dư tối thiểu"
                value={formData.eventName}
                onChange={(e) => setFormData(p => ({ ...p, eventName: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kênh gửi tin nhắn</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(p => ({ ...p, channel: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="EMAIL">Thư điện tử (EMAIL)</option>
                <option value="SMS">Tin nhắn thoại di động (SMS)</option>
                <option value="PUSH_NOTIFICATION">Thông báo nổi màn hình (PUSH)</option>
                <option value="WEBHOOK_SLACK">Slack/Microsoft Teams Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Độ khẩn cấp</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData(p => ({ ...p, urgency: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="CRITICAL">NGUY CẤP (CRITICAL)</option>
                <option value="HIGH">CAO (HIGH)</option>
                <option value="NORMAL">TRUNG BÌNH (NORMAL)</option>
                <option value="LOW">THẤP (LOW)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đối tượng nhận (Recipient Role Scope)</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: ROLE-STORE-MGR, ROLE-PURCHASE-MGR"
              value={formData.recipientRoleScope}
              onChange={(e) => setFormData(p => ({ ...p, recipientRoleScope: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề cảnh báo mẫu (Subject Header)</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 🚨 [CẢNH BÁO] Hàng hóa cạn kiệt!"
              value={formData.templateSubject}
              onChange={(e) => setFormData(p => ({ ...p, templateSubject: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nội dung mẫu biến động tham chiếu (Body Template)</label>
            <textarea
              required
              rows={4}
              placeholder="Ví dụ: Sản phẩm {{sku_name}} tại chi nhánh {{branch_name}} đã chạm ngưỡng tối thiểu..."
              value={formData.templateBody}
              onChange={(e) => setFormData(p => ({ ...p, templateBody: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary text-xs"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu luật cảnh báo
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        title="Xóa luật thông báo cảnh báo tự động"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-300">CẢNH BÁO HỦY LUẬT PHÂN PHỐI TIN NHẮN</p>
              <p className="text-2xs text-red-700 dark:text-red-400 mt-0.5">Xóa quy tắc này sẽ tắt hoàn toàn các cảnh báo tự động gửi về Slack/SMS của cấp quản lý khi có sự cố khẩn cấp xảy ra.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa luật cảnh báo <strong>{deletingRule?.eventName}</strong> khỏi hệ thống?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingRule(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      {/* DYNAMIC PREMIUM DISPATCH ANIMATION PREVIEWS */}
      {simulatedDispatch && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce transition-all duration-300 max-w-sm w-full">
          {simulatedDispatch.channel === 'WEBHOOK_SLACK' ? (
            <div className="bg-[#1A1D21] text-white p-4 rounded-xl border border-gray-800 shadow-2xl space-y-3 font-sans">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#E01E5A] rounded flex items-center justify-center text-white text-3xs font-extrabold">#</span>
                  <span className="text-xs font-bold text-gray-300">#security-ops-alerts</span>
                </div>
                <span className="text-3xs text-gray-500 font-mono">Slack APP</span>
              </div>
              <div className="flex gap-2 bg-[#222529] p-3 rounded-lg border-l-4 border-red-600">
                <div className="text-base shrink-0">🚨</div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">{simulatedDispatch.templateSubject}</p>
                  <p className="text-3xs text-gray-300 leading-normal font-mono">{simulatedDispatch.templateBody.replace('{{sku_name}}', 'Adidas Ultraboost').replace('{{sku_code}}', 'SKU-9921').replace('{{branch_name}}', 'Flagship Plaza').replace('{{current_stock}}', '4').replace('{{min_threshold}}', '10')}</p>
                </div>
              </div>
            </div>
          ) : simulatedDispatch.channel === 'SMS' ? (
            <div className="bg-black/90 text-white p-4 rounded-3xl border border-gray-800 shadow-2xl space-y-2 max-w-[280px] mx-auto relative overflow-hidden font-sans border-2 border-gray-700">
              <div className="text-center text-3xs text-gray-500 border-b border-gray-800 pb-1.5 font-semibold">TIN NHẮN CẢNH BÁO</div>
              <div className="bg-gray-900 p-2.5 rounded-2xl text-2xs leading-relaxed font-semibold">
                <span className="text-red-400 font-bold block mb-1">Urgency: {simulatedDispatch.urgency}</span>
                {simulatedDispatch.templateBody.replace('{{cashier_name}}', 'Sarah Jenkins').replace('{{terminal_id}}', '#04').replace('{{discrepancy_amount}}', '45.00')}
              </div>
              <p className="text-4xs text-center text-gray-600 font-bold">Slide down to reply</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl flex items-start gap-3 border-l-4 border-primary">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-swing" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{simulatedDispatch.templateSubject}</p>
                <p className="text-3xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {simulatedDispatch.templateBody.replace('{{transfer_id}}', 'TXN-88192').replace('{{amount}}', '84,500.00').replace('{{vendor_name}}', 'Titan Logistics')}
                </p>
                <span className="inline-block text-4xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold mt-1">
                  Đã dispatch qua {simulatedDispatch.channel}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
