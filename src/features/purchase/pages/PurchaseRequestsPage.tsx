import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Calendar, User, ClipboardList, Briefcase, FileText, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

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

const MOCK_DATA: PurchaseRequestItem[] = [
  {
    id: '1',
    requestCode: 'PR-2026-001',
    requestDate: '2026-06-01',
    department: 'Bộ phận Kho vận',
    reason: 'Mua bổ sung 10 xe đẩy hàng và 5 máy quét mã vạch không dây phục vụ phân khu mới',
    estimatedTotal: 35000000,
    proposedBy: 'Phạm Minh Hải (Trưởng Kho)',
    status: 'CHỜ_DUYỆT',
    notes: 'Ưu tiên mua máy quét Zebra để đồng bộ hệ thống.',
    itemsList: [
      { itemName: 'Xe đẩy hàng 2 bánh tải trọng 300kg', qty: 10, unit: 'Cái', estimatedPrice: 2000000 },
      { itemName: 'Máy quét mã vạch Zebra LI4278', qty: 5, unit: 'Cái', estimatedPrice: 3000000 }
    ]
  },
  {
    id: '2',
    requestCode: 'PR-2026-002',
    requestDate: '2026-05-28',
    department: 'Bộ phận Hành chính nhân sự',
    reason: 'Trang bị văn phòng phẩm định kỳ Quý II và 2 máy in Canon LBP2900',
    estimatedTotal: 12800000,
    proposedBy: 'Lê Thùy Dương (Hành chính)',
    status: 'ĐÃ_CHUYỂN_PO',
    notes: 'Đã tạo PO-2026-045 gửi nhà cung cấp Hồng Hà.',
    itemsList: [
      { itemName: 'Giấy Double A A4 70gsm', qty: 50, unit: 'Ram', estimatedPrice: 76000 },
      { itemName: 'Máy in Canon LBP2900', qty: 2, unit: 'Cái', estimatedPrice: 4500000 }
    ]
  },
  {
    id: '3',
    requestCode: 'PR-2026-003',
    requestDate: '2026-05-25',
    department: 'Bộ phận Công nghệ (IT)',
    reason: 'Mua bản quyền phần mềm thiết kế và nâng cấp RAM máy chủ',
    estimatedTotal: 45000000,
    proposedBy: 'Nguyễn Tuấn Anh (IT Manager)',
    status: 'TỪ_CHỐI',
    notes: 'Hết ngân sách IT tháng 5, dời sang đề xuất tháng 6 duyệt lại.',
    itemsList: [
      { itemName: 'Gói Adobe Creative Cloud 1 năm', qty: 3, unit: 'User', estimatedPrice: 10000000 },
      { itemName: 'RAM Server DDR4 ECC 32GB', qty: 5, unit: 'Thanh', estimatedPrice: 3000000 }
    ]
  }
];

export function PurchaseRequestsPage() {
  const [data, setData] = useState<PurchaseRequestItem[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<PurchaseRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<PurchaseRequestItem>>({});

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.reason || !editingItem.estimatedTotal) return;

    const newItem: PurchaseRequestItem = {
      id: String(data.length + 1),
      requestCode: editingItem.requestCode || `PR-2026-00${data.length + 1}`,
      requestDate: editingItem.requestDate || new Date().toISOString().split('T')[0],
      department: editingItem.department || 'Bộ phận Kho vận',
      reason: editingItem.reason,
      estimatedTotal: Number(editingItem.estimatedTotal),
      proposedBy: editingItem.proposedBy || 'Nhân viên đề xuất',
      status: (editingItem.status as any) || 'CHỜ_DUYỆT',
      notes: editingItem.notes || '',
      itemsList: [
        { itemName: 'Mặt hàng đề xuất mẫu', qty: 1, unit: 'Cái', estimatedPrice: Number(editingItem.estimatedTotal) }
      ]
    };
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchaseRequestItem>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã Yêu Cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'requestDate',
        header: 'Ngày Đề Xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Bộ Phận Đề Xuất',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Lý Do Đề Xuất',
        cell: (info) => <span className="text-gray-500 text-sm whitespace-normal max-w-xs block line-clamp-2">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedTotal',
        header: 'Tổng Tiền Dự Kiến',
        cell: (info) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'proposedBy',
        header: 'Người Đề Xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
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
        header: 'Thao Tác',
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu Cầu Mua Hàng (Purchase Request)</h1>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelectedItem} />
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
                <option value="Ban Giám Đốc">Ban Giám Đốc</option>
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
