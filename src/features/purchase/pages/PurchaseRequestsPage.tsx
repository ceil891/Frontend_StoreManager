import { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Calendar, User, ClipboardList, Briefcase, FileText, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface PurchaseRequestItem {
  id: string;
  requestCode: string;
  requestDate: string;
  department: string;
  reason: string;
  estimatedTotal: number;
  proposedBy: string;
  status: 'CHỜ_DUYỆT' | 'ĐÃ_CHUYỂN_PO' | 'TỪ_CHỐI';
  notes?: string;
  itemsList?: { itemName: string; qty: number; unit: string; estimatedPrice: number }[];
}

export function PurchaseRequestsPage() {
  const [data, setData] = useState<PurchaseRequestItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<PurchaseRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PurchaseRequestItem>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/purchase/requests?size=500');
      const list = (res as any).content || res || [];
      const mapped: PurchaseRequestItem[] = (Array.isArray(list) ? list : []).map((item: any) => {
        const statusMap: Record<string, PurchaseRequestItem['status']> = {
          DRAFT: 'CHỜ_DUYỆT',
          PENDING_APPROVAL: 'CHỜ_DUYỆT',
          APPROVED: 'ĐÃ_CHUYỂN_PO',
          COMPLETED: 'ĐÃ_CHUYỂN_PO',
          REJECTED: 'TỪ_CHỐI',
        };
        return {
          id: String(item.id),
          requestCode: item.requestCode || '',
          requestDate: item.requestDate || '',
          department: item.branch?.name || item.department || '',
          reason: item.reason || '',
          estimatedTotal: item.estimatedTotal || 0,
          proposedBy: item.proposedBy || item.createdBy || '',
          status: statusMap[item.status] || 'CHỜ_DUYỆT',
          notes: item.notes || '',
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu mua hàng:', err);
      toast.error('Không thể tải danh sách yêu cầu mua hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase()) ||
      item.proposedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingItem({
      requestCode: `PR-2026-00${data.length + 1}`,
      requestDate: new Date().toISOString().split('T')[0],
      department: 'Bộ phận Kho vận',
      reason: '',
      estimatedTotal: 0,
      proposedBy: 'Nguyễn Văn A',
      status: 'CHỜ_DUYỆT',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.reason || !editingItem.estimatedTotal) return;

    try {
      const statusMap: Record<string, string> = {
        'CHỜ_DUYỆT': 'PENDING_APPROVAL',
        'ĐÃ_CHUYỂN_PO': 'APPROVED',
        'TỪ_CHỐI': 'REJECTED',
      };
      const payload = {
        requestCode: editingItem.requestCode || `PR-2026-00${data.length + 1}`,
        requestDate: editingItem.requestDate || new Date().toISOString().split('T')[0],
        reason: editingItem.reason,
        estimatedTotal: Number(editingItem.estimatedTotal),
        status: statusMap[editingItem.status || 'CHỜ_DUYỆT'] || 'PENDING_APPROVAL',
        notes: editingItem.notes || '',
      };
      await axiosClient.post('/purchase/requests', payload);
      toast.success('Tạo yêu cầu mua hàng thành công');
      await fetchRequests();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi tạo yêu cầu mua hàng:', err);
      toast.error('Không thể tạo yêu cầu mua hàng');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchaseRequestItem>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'requestDate',
        header: 'Ngày đề xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Bộ phận đề xuất',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Lý do đề xuất',
        cell: (info) => <span className="text-gray-500 text-sm whitespace-normal max-w-xs block line-clamp-2">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedTotal',
        header: 'Tổng tiền dự kiến',
        cell: (info) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'proposedBy',
        header: 'Người đề xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = '';
          let icon = null;

          if (status === 'ĐÃ_CHUYỂN_PO') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'CHỜ_DUYỆT') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            icon = <Clock className="w-3.5 h-3.5" />;
          } else {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {icon}
              {status === 'ĐÃ_CHUYỂN_PO' ? 'ĐÃ CHUYỂN PO' : status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu mua hàng (purchase request)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phê duyệt các yêu cầu mua sắm thiết bị, vật tư văn phòng hoặc nhập hàng hóa từ các bộ phận trước khi tạo đơn PO chính thức.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo phiếu yêu cầu
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
              placeholder="Tìm kiếm theo mã yêu cầu, bộ phận, lý do hoặc người đề xuất..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="CHỜ_DUYỆT">CHỜ DUYỆT</option>
              <option value="ĐÃ_CHUYỂN_PO">ĐÃ CHUYỂN PO</option>
              <option value="TỪ_CHỐI">TỪ CHỐI</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedItem(row)} />
        )}
      </div>

      {/* Drawer Chi tiết và mặt hàng mua */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết Yêu cầu: ${selectedItem.requestCode}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng ngân sách dự kiến</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedItem.estimatedTotal)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400" /> Mã yêu cầu:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.requestCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> Bộ phận đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.department}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" /> Người đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.proposedBy}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Ngày đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.requestDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái phê duyệt:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedItem.status === 'ĐÃ_CHUYỂN_PO'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : selectedItem.status === 'CHỜ_DUYỆT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedItem.status === 'ĐÃ_CHUYỂN_PO' ? 'ĐÃ CHUYỂN PO' : selectedItem.status}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Lý do đề xuất mua sắm</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-850 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 shadow-sm leading-relaxed">{selectedItem.reason}</p>
              </div>
              {selectedItem.notes && (
                <div className="pt-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú duyệt</span>
                  <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 italic">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            {/* Chi tiết mặt hàng mua */}
            {selectedItem.itemsList && selectedItem.itemsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ChevronRight className="w-4 h-4 text-emerald-500" /> Danh sách thiết bị/vật tư đề xuất mua:
                </h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs">
                      <tr>
                        <th className="p-3">Tên sản phẩm / vật tư</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3 text-right">Đơn giá dự kiến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {selectedItem.itemsList.map((itm, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{itm.itemName}</td>
                          <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-semibold">{itm.qty}</td>
                          <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-xs">{itm.unit}</td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(itm.estimatedPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal tạo phiếu yêu cầu mua hàng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo phiếu yêu cầu mua hàng mới"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu (Hệ thống) *</label>
              <input
                type="text"
                value={editingItem.requestCode || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày lập đề xuất *</label>
              <input
                type="date"
                value={editingItem.requestDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, requestDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bộ phận đề xuất *</label>
              <select
                value={editingItem.department || 'Bộ phận Kho vận'}
                onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bộ phận Kho vận">Bộ phận Kho vận</option>
                <option value="Bộ phận Hành chính nhân sự">Bộ phận Hành chính nhân sự</option>
                <option value="Bộ phận Công nghệ (IT)">Bộ phận Công nghệ (IT)</option>
                <option value="Phòng Kinh doanh / Bán hàng">Phòng Kinh doanh / Bán hàng</option>
                <option value="Ban giám đốc">Ban giám đốc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người đề xuất *</label>
              <input
                type="text"
                value={editingItem.proposedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, proposedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Nhập tên người đề cử..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng kinh phí dự toán (VND) *</label>
            <input
              type="number"
              value={editingItem.estimatedTotal || ''}
              onChange={(e) => setEditingItem({ ...editingItem, estimatedTotal: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Nhập tổng giá trị dự kiến..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do & mục đích đề xuất mua hàng *</label>
            <textarea
              rows={3}
              value={editingItem.reason || ''}
              onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Giải trình cụ thể nhu cầu sử dụng..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú bổ sung</label>
            <textarea
              rows={2}
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Hướng dẫn thêm cho bộ phận mua sắm..."
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Tạo phiếu đề xuất
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
