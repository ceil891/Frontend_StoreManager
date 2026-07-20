import { useMemo, useState, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Filter, Eye, LifeBuoy, Building2, CheckCircle2, Clock, ShieldAlert, Send, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: 'POS_HARDWARE' | 'SOFTWARE_SYNC' | 'BILLING_DISPUTE' | 'SHIPPING_DELAY' | 'WARRANTY_CLAIM' | 'GENERAL_INQUIRY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  assignedAgent: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  internalNotes?: string;
}

const MOCK_TICKETS: SupportTicketRecord[] = [
  { id: '1', ticketNumber: 'TCK-9910', customerName: 'Johnathan Vance', customerEmail: 'j.vance@enterprise-group.org', subject: 'Barcode scanner intermittent connection drop on aisle 4', category: 'POS_HARDWARE', priority: 'HIGH', status: 'IN_PROGRESS', assignedAgent: 'Michael Chang', createdAt: '2024-05-17 09:15', updatedAt: '2024-05-17 14:30', lastMessage: 'We have dispatched a replacement USB dongle via courier. Please test upon arrival.', internalNotes: 'VIP enterprise account. Ensure minimal downtime. Hardware swapped under advance RMA.' },
  { id: '2', ticketNumber: 'TCK-9912', customerName: 'Alice Smith-Bauer', customerEmail: 'alice@smithbauer-design.com', subject: 'Requesting bulk export of annual VAT tax invoices', category: 'BILLING_DISPUTE', priority: 'MEDIUM', status: 'RESOLVED', assignedAgent: 'Sarah Jenkins', createdAt: '2024-05-16 11:20', updatedAt: '2024-05-17 10:00', lastMessage: 'Attached zip archive containing all monthly statements for FY2023. Ticket resolved.' },
  { id: '3', ticketNumber: 'TCK-9915', customerName: 'Robert Jenkins Junior', customerEmail: 'rob.jenkins@outlook.com', subject: 'Loyalty points did not credit after purchasing coffee grinder', category: 'SOFTWARE_SYNC', priority: 'LOW', status: 'OPEN', assignedAgent: 'Unassigned', createdAt: '2024-05-17 15:45', updatedAt: '2024-05-17 15:45', lastMessage: 'Customer receipt #RCP-8819 indicates offline transaction during network outage.' },
  { id: '4', ticketNumber: 'TCK-9918', customerName: 'Diana Prince', customerEmail: 'diana@themyscira-imports.com', subject: 'Damaged display case glass during freight transit', category: 'SHIPPING_DELAY', priority: 'URGENT', status: 'WAITING_ON_CUSTOMER', assignedAgent: 'David Ross', createdAt: '2024-05-15 16:30', updatedAt: '2024-05-16 09:00', lastMessage: 'Please provide photos of the damaged shipping pallet so we can file an insurance claim with DHL.' },
];

const priorityStyles = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  HIGH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const priorityMap: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const statusMapFull: Record<string, string> = {
  OPEN: 'Mới mở',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_ON_CUSTOMER: 'Chờ khách phản hồi',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

const catMapFull: Record<string, string> = {
  POS_HARDWARE: 'Phần cứng POS',
  SOFTWARE_SYNC: 'Đồng bộ phần mềm',
  BILLING_DISPUTE: 'Khiếu nại hóa đơn',
  SHIPPING_DELAY: 'Chậm trễ giao hàng',
  WARRANTY_CLAIM: 'Yêu cầu bảo hành',
  GENERAL_INQUIRY: 'Tư vấn chung',
};

export function SupportTicketsPage() {
  const [data, setData] = useState<SupportTicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTicket, setEditingTicket] = useState<Partial<SupportTicketRecord>>({});
  const [deletingTicket, setDeletingTicket] = useState<SupportTicketRecord | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await axiosClient.get('/crm/tickets');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: SupportTicketRecord[] = list.map((item: any) => ({
          id: String(item.id),
          ticketNumber: item.ticketNumber || `TCK-${item.id}`,
          customerName: item.customer?.name || item.customerName || 'Khách hàng',
          customerEmail: item.customer?.email || item.customerEmail || 'customer@email.com',
          subject: item.title || item.subject || 'Hỗ trợ khách hàng',
          category: item.category || 'GENERAL_INQUIRY',
          priority: item.priority || 'MEDIUM',
          status: item.status || 'OPEN',
          assignedAgent: item.assignedTo?.name || item.assignedAgent || 'Unassigned',
          createdAt: item.createdDate ? String(item.createdDate).split('T')[0] : '2024-05-17',
          updatedAt: item.lastModifiedDate ? String(item.lastModifiedDate).split('T')[0] : '2024-05-17',
          lastMessage: item.description || item.lastMessage || 'Chi tiết hỗ trợ...',
          internalNotes: item.internalNotes || '',
        }));
        setData(mapped);
      } else {
        setData(MOCK_TICKETS);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      toast.error('Lỗi khi tải phiếu hỗ trợ, dùng dữ liệu tạm');
      setData(MOCK_TICKETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingTicket({
      ticketNumber: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: '',
      customerEmail: '',
      subject: '',
      category: 'GENERAL_INQUIRY',
      priority: 'LOW',
      status: 'OPEN',
      assignedAgent: 'Unassigned',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastMessage: '',
      internalNotes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tck: SupportTicketRecord) => {
    setModalMode('edit');
    setEditingTicket(tck);
    setIsModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket.subject || !editingTicket.customerName) return;

    const payload = {
      ticketNumber: editingTicket.ticketNumber,
      title: editingTicket.subject,
      description: editingTicket.lastMessage,
      priority: editingTicket.priority,
      status: editingTicket.status,
    };

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/crm/tickets', payload);
        toast.success(`Tạo phiếu hỗ trợ ${editingTicket.ticketNumber} thành công!`);
      } else if (editingTicket.id) {
        await axiosClient.put(`/crm/tickets/${editingTicket.id}`, payload);
        toast.success(`Cập nhật phiếu hỗ trợ ${editingTicket.ticketNumber} thành công!`);
      }
      setIsModalOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error saving ticket:', err);
      toast.error('Lỗi khi lưu phiếu hỗ trợ');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTicket) return;
    try {
      await axiosClient.delete(`/crm/tickets/${deletingTicket.id}`);
      toast.success(`Đã xóa phiếu hỗ trợ ${deletingTicket.ticketNumber}`);
      setData((prev) => prev.filter((item) => item.id !== deletingTicket.id));
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast.error('Lỗi khi xóa phiếu hỗ trợ');
    } finally {
      setDeletingTicket(null);
    }
  };

  const columns = useMemo<ColumnDef<SupportTicketRecord>[]>(
    () => [
      {
        accessorKey: 'ticketNumber',
        header: 'Mã phiếu',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'subject',
        header: 'Tiêu đề & Danh mục',
        cell: ({ row }) => {
          return (
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-sm">{row.original.subject}</p>
              <span className="text-xs font-mono text-gray-500">{catMapFull[row.original.category] || row.original.category.replace('_', ' ')}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.customerName}</p>
            <p className="text-xs text-gray-500">{row.original.customerEmail}</p>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Độ ưu tiên',
        cell: (info) => {
          const p = info.getValue() as keyof typeof priorityStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${priorityStyles[p]}`}>
              {priorityMap[p] || p}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'RESOLVED' || status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'WAITING_ON_CUSTOMER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
            }`}>
              {statusMapFull[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedAgent',
        header: 'Nhân viên phụ trách',
        cell: (info) => <span className={`font-semibold ${info.getValue() === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-900 dark:text-white'}`}>{info.getValue() === 'Unassigned' ? 'Chưa phân công' : (info.getValue() as string)}</span>,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Cập nhật lần cuối',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedTicket(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingTicket(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hỗ trợ khách hàng (support helpdesk)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các yêu cầu hỗ trợ từ nhiều kênh, xử lý bảo hành thiết bị và khiếu nại dịch vụ. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu hỗ trợ
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo phiếu hỗ trợ mới
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo số phiếu, tiêu đề, tên khách hàng hoặc nhân viên..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedTicket(row)} />
      </div>

      <Drawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Phiếu Hỗ Trợ: ${selectedTicket.ticketNumber}` : 'Chi tiết phiếu'}
        width="max-w-lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedTicket.priority === 'URGENT' || selectedTicket.priority === 'HIGH'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-primary/10 border-primary/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedTicket.priority === 'URGENT' ? 'bg-red-600' : selectedTicket.priority === 'HIGH' ? 'bg-amber-600' : 'bg-primary'
                }`}>
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Độ khẩn cấp</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${priorityStyles[selectedTicket.priority]}`}>
                    ƯU TIÊN {priorityMap[selectedTicket.priority] || selectedTicket.priority}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedTicket.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedTicket.status === 'WAITING_ON_CUSTOMER' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100'
              }`}>
                {statusMapFull[selectedTicket.status] || selectedTicket.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-primary" /> Nhân viên tiếp nhận
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTicket.assignedAgent === 'Unassigned' ? 'Chưa phân công' : selectedTicket.assignedAgent}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" /> Cập nhật lần cuối
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTicket.updatedAt}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tiêu đề vấn đề</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                <span className="inline-block mt-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  Danh mục: {catMapFull[selectedTicket.category] || selectedTicket.category}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nội dung trao đổi mới nhất</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-inner">
                  "{selectedTicket.lastMessage}"
                </p>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Khách hàng liên hệ:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTicket.customerName} ({selectedTicket.customerEmail})</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thời gian tạo phiếu:</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedTicket.createdAt}</span>
              </div>

              {selectedTicket.internalNotes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Ghi chú nội bộ (Bảo mật)
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-200 dark:border-amber-900/30">
                    {selectedTicket.internalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã giải quyết
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Send className="w-4 h-4 inline mr-1" /> Trả lời khách hàng
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu hỗ trợ mới' : 'Chỉnh sửa phiếu hỗ trợ'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phiếu *</label>
              <input
                type="text"
                value={editingTicket.ticketNumber || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, ticketNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục *</label>
              <select
                value={editingTicket.category || 'GENERAL_INQUIRY'}
                onChange={(e) => setEditingTicket({ ...editingTicket, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="POS_HARDWARE">Phần cứng POS</option>
                <option value="SOFTWARE_SYNC">Đồng bộ phần mềm</option>
                <option value="BILLING_DISPUTE">Khiếu nại hóa đơn</option>
                <option value="SHIPPING_DELAY">Chậm trễ giao hàng</option>
                <option value="WARRANTY_CLAIM">Yêu cầu bảo hành</option>
                <option value="GENERAL_INQUIRY">Tư vấn chung</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng liên hệ *</label>
              <input
                type="text"
                value={editingTicket.customerName || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, customerName: e.target.value })}
                placeholder="Họ và tên..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email liên hệ *</label>
              <input
                type="email"
                value={editingTicket.customerEmail || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, customerEmail: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề vấn đề *</label>
            <input
              type="text"
              value={editingTicket.subject || ''}
              onChange={(e) => setEditingTicket({ ...editingTicket, subject: e.target.value })}
              placeholder="Mô tả tóm tắt sự cố..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Độ ưu tiên</label>
              <select
                value={editingTicket.priority || 'LOW'}
                onChange={(e) => setEditingTicket({ ...editingTicket, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="LOW">Thấp (low)</option>
                <option value="MEDIUM">Trung bình (Med)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
              <select
                value={editingTicket.status || 'OPEN'}
                onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="OPEN">Mới mở</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="WAITING_ON_CUSTOMER">Chờ phản hồi</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhân viên phụ trách</label>
              <input
                type="text"
                value={editingTicket.assignedAgent || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, assignedAgent: e.target.value })}
                placeholder="Tên nhân viên..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung trao đổi</label>
            <textarea
              rows={3}
              value={editingTicket.lastMessage || ''}
              onChange={(e) => setEditingTicket({ ...editingTicket, lastMessage: e.target.value })}
              placeholder="Tin nhắn từ khách hoặc câu trả lời từ đội hỗ trợ..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Ghi chú nội bộ (Không hiển thị cho khách)</label>
            <textarea
              rows={2}
              value={editingTicket.internalNotes || ''}
              onChange={(e) => setEditingTicket({ ...editingTicket, internalNotes: e.target.value })}
              placeholder="Ghi chú điều khoản RMA, lịch sử liên hệ đặc biệt..."
              className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingTicket}
        onClose={() => setDeletingTicket(null)}
        title="Xác nhận xóa phiếu hỗ trợ"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn gỡ bỏ hoàn toàn phiếu hỗ trợ <strong className="text-gray-900 dark:text-white">{deletingTicket?.ticketNumber}</strong> (<span className="font-semibold">{deletingTicket?.subject}</span>)?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ xóa toàn bộ nội dung thảo luận, tập tin đính kèm và lịch sử hỗ trợ của khách hàng này khỏi hệ thống.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingTicket(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
