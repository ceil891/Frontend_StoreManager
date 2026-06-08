import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, RotateCcw, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ReturnToSupplierItem {
  id: string;
  returnNumber: string; // RTV Number
  grnRefNumber: string; // Original GRN Reference
  supplierName: string;
  dispatchingStore: string;
  returnDate: string;
  returnedItemsCount: number;
  claimValuation: number;
  reason: 'DEFECTIVE_BATCH' | 'WRONG_SPECIFICATION' | 'EXPIRED_ON_ARRIVAL' | 'EXCESS_UNORDERED';
  status: 'PENDING_SUPPLIER_APPROVAL' | 'APPROVED_CREDIT_NOTE' | 'REPLACEMENT_DISPATCHED' | 'REJECTED';
  logisticsCarrier: string;
  trackingNumber?: string;
  filedBy: string;
  notes?: string;
}

const INITIAL_SUPPLIER_RETURNS: ReturnToSupplierItem[] = [
  { id: '1', returnNumber: 'RTV-2024-001', grnRefNumber: 'GRN-2024-302', supplierName: 'Apex Premium Packaging', dispatchingStore: 'Kho phân phối Trung tâm', returnDate: '2024-05-17', returnedItemsCount: 150, claimValuation: 12300000, reason: 'DEFECTIVE_BATCH', status: 'APPROVED_CREDIT_NOTE', logisticsCarrier: 'Vận tải Nội bộ', trackingNumber: 'TRK-90182931', filedBy: 'David Ross', notes: 'Phát hiện túi giấy bị thấm nước khi dỡ hàng. Nhà cung cấp đồng ý cấn trừ vào hóa đơn sau.' },
  { id: '2', returnNumber: 'RTV-2024-002', grnRefNumber: 'GRN-2024-280', supplierName: 'Nordic Apparel Mills', dispatchingStore: 'Chi nhánh Quận 1', returnDate: '2024-05-14', returnedItemsCount: 25, claimValuation: 12500000, reason: 'WRONG_SPECIFICATION', status: 'REPLACEMENT_DISPATCHED', logisticsCarrier: 'DHL Express', trackingNumber: 'DHL-55219018', filedBy: 'Sarah Jenkins', notes: 'Nhận size XL thay vì M trong thùng hàng số 4.' },
  { id: '3', returnNumber: 'RTV-2024-003', grnRefNumber: 'GRN-2024-255', supplierName: 'Omega Hardware Wholesalers', dispatchingStore: 'Cửa hàng Tân Bình', returnDate: '2024-05-10', returnedItemsCount: 12, claimValuation: 8900000, reason: 'EXCESS_UNORDERED', status: 'PENDING_SUPPLIER_APPROVAL', logisticsCarrier: 'FedEx', trackingNumber: 'FX-00192831', filedBy: 'Michael Chang', notes: 'Gửi dư hàng không có trong hóa đơn. Trả lại để tránh lệch kho.' },
];

export function ReturnToSupplierPage() {
  const [data, setData] = useState<ReturnToSupplierItem[]>(INITIAL_SUPPLIER_RETURNS);
  const [search, setSearch] = useState('');
  const [selectedRTV, setSelectedRTV] = useState<ReturnToSupplierItem | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingRTV, setEditingRTV] = useState<Partial<ReturnToSupplierItem>>({});
  const [deletingRTV, setDeletingRTV] = useState<ReturnToSupplierItem | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.supplierName.toLowerCase().includes(q) ||
        item.returnNumber.toLowerCase().includes(q) ||
        item.grnRefNumber.toLowerCase().includes(q) ||
        item.dispatchingStore.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingRTV({
      returnNumber: `RTV-${Date.now().toString().slice(-6)}`,
      grnRefNumber: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: '',
      dispatchingStore: 'Kho phân phối Trung tâm',
      returnDate: new Date().toISOString().split('T')[0],
      returnedItemsCount: 1,
      claimValuation: 0,
      reason: 'DEFECTIVE_BATCH',
      status: 'PENDING_SUPPLIER_APPROVAL',
      logisticsCarrier: 'Nhà xe nội địa',
      trackingNumber: '',
      filedBy: 'Người quản lý',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rtv: ReturnToSupplierItem) => {
    setFormMode('edit');
    setEditingRTV(rtv);
    setIsFormOpen(true);
  };

  const handleSaveRTV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRTV.returnNumber || !editingRTV.supplierName) return;

    const payload: ReturnToSupplierItem = {
      id: editingRTV.id || Date.now().toString(),
      returnNumber: editingRTV.returnNumber,
      grnRefNumber: editingRTV.grnRefNumber || '',
      supplierName: editingRTV.supplierName,
      dispatchingStore: editingRTV.dispatchingStore || '',
      returnDate: editingRTV.returnDate || '',
      returnedItemsCount: Number(editingRTV.returnedItemsCount) || 0,
      claimValuation: Number(editingRTV.claimValuation) || 0,
      reason: editingRTV.reason || 'DEFECTIVE_BATCH',
      status: editingRTV.status || 'PENDING_SUPPLIER_APPROVAL',
      logisticsCarrier: editingRTV.logisticsCarrier || '',
      trackingNumber: editingRTV.trackingNumber || '',
      filedBy: editingRTV.filedBy || 'Hệ thống',
      notes: editingRTV.notes || '',
    };

    if (formMode === 'create') {
      setData([payload, ...data]);
    } else {
      setData(data.map(item => item.id === payload.id ? payload : item));
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRTV) return;
    setData(data.filter(item => item.id !== deletingRTV.id));
    setDeletingRTV(null);
    if (selectedRTV?.id === deletingRTV.id) {
      setSelectedRTV(null);
    }
  };

  const columns = useMemo<ColumnDef<ReturnToSupplierItem>[]>(
    () => [
      {
        accessorKey: 'returnNumber',
        header: 'Mã trả hàng (RTV)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'grnRefNumber',
        header: 'Mã GRN gốc',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'dispatchingStore',
        header: 'Kho / Chi nhánh xuất',
      },
      {
        accessorKey: 'returnedItemsCount',
        header: 'Số lượng trả',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'claimValuation',
        header: 'Giá trị yêu cầu',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái xử lý',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            PENDING_SUPPLIER_APPROVAL: 'Chờ NCC phản hồi',
            APPROVED_CREDIT_NOTE: 'Đã duyệt bồi hoàn',
            REPLACEMENT_DISPATCHED: 'Đang gửi hàng đổi',
            REJECTED: 'Từ chối',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'APPROVED_CREDIT_NOTE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'REPLACEMENT_DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING_SUPPLIER_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedRTV(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
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
              onClick={(e) => { e.stopPropagation(); setDeletingRTV(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const statusMap: Record<string, string> = {
    PENDING_SUPPLIER_APPROVAL: 'Chờ nhà cung cấp phản hồi',
    APPROVED_CREDIT_NOTE: 'Đã duyệt Credit Note bồi hoàn',
    REPLACEMENT_DISPATCHED: 'Đang gửi hàng hóa thay thế',
    REJECTED: 'Từ chối yêu cầu',
  };

  const reasonLabels: Record<string, string> = {
    DEFECTIVE_BATCH: 'Lô hàng bị lỗi chất lượng',
    WRONG_SPECIFICATION: 'Sai thông số / Sai mẫu mã đặt hàng',
    EXPIRED_ON_ARRIVAL: 'Hết hạn sử dụng khi giao hàng',
    EXCESS_UNORDERED: 'Giao dư số lượng đặt hàng',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trả hàng cho Nhà cung cấp (RTV)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các đợt hoàn trả hàng lỗi, yêu cầu bồi hoàn và đổi trả sản phẩm. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo đơn trả hàng
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã RTV, mã GRN hoặc nhà cung cấp..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái xử lý:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_SUPPLIER_APPROVAL">Chờ NCC phản hồi (PENDING SUPPLIER APPROVAL)</option>
                <option value="APPROVED_CREDIT_NOTE">Đã duyệt bồi hoàn (APPROVED CREDIT NOTE)</option>
                <option value="REPLACEMENT_DISPATCHED">Đang gửi hàng đổi (REPLACEMENT DISPATCHED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedRTV(row)} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedRTV}
        onClose={() => setSelectedRTV(null)}
        title={selectedRTV ? `Chi tiết trả hàng nhà cung cấp (RTV): ${selectedRTV.returnNumber}` : 'Chi tiết trả hàng RTV'}
        width="max-w-lg"
      >
        {selectedRTV && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Giá trị yêu cầu hoàn tiền</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedRTV.claimValuation.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedRTV.status === 'APPROVED_CREDIT_NOTE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedRTV.status === 'REPLACEMENT_DISPATCHED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedRTV.status === 'PENDING_SUPPLIER_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {statusMap[selectedRTV.status] || selectedRTV.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Nhà cung cấp nhận
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedRTV.supplierName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày giao gửi hàng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedRTV.returnDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã tham chiếu GRN nhập hàng gốc:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedRTV.grnRefNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Kho xuất phát hàng trả:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.dispatchingStore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tổng số lượng trả:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.returnedItemsCount} đơn vị</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Đơn vị vận chuyển & Mã tracking:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedRTV.logisticsCarrier} {selectedRTV.trackingNumber && <span className="font-mono text-xs text-gray-500">({selectedRTV.trackingNumber})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Nhân viên vận tải phụ trách:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.filedBy}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Lý do phân loại trả hàng RTV</span>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-200 dark:border-gray-700">{reasonLabels[selectedRTV.reason] || selectedRTV.reason}</p>
              </div>

              {selectedRTV.notes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Thỏa thuận khấu trừ & Ghi chú</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedRTV.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedRTV.status === 'PENDING_SUPPLIER_APPROVAL' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Ghi nhận Credit Note từ NCC
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> In phiếu trả hàng RTV
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? 'Tạo Đơn Trả Hàng Cho NCC Mới' : 'Chỉnh Sửa Đơn Trả Hàng NCC'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveRTV} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mã trả hàng (RTV Number) *</label>
              <input
                type="text"
                value={editingRTV.returnNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mã GRN gốc nhập hàng *</label>
              <input
                type="text"
                value={editingRTV.grnRefNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, grnRefNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tên Nhà cung cấp *</label>
              <input
                type="text"
                value={editingRTV.supplierName || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, supplierName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kho / Chi nhánh xuất trả *</label>
              <input
                type="text"
                value={editingRTV.dispatchingStore || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, dispatchingStore: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Số lượng trả *</label>
              <input
                type="number"
                value={editingRTV.returnedItemsCount ?? ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnedItemsCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Giá trị yêu cầu hoàn (đ) *</label>
              <input
                type="text"
                value={(editingRTV.claimValuation ?? 0) === 0 ? '' : Math.round(editingRTV.claimValuation ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const val = digits === '' ? 0 : parseInt(digits, 10);
                  setEditingRTV({ ...editingRTV, claimValuation: val });
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày trả hàng *</label>
              <input
                type="date"
                value={editingRTV.returnDate || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Lý do trả hàng *</label>
              <select
                value={editingRTV.reason || 'DEFECTIVE_BATCH'}
                onChange={(e) => setEditingRTV({ ...editingRTV, reason: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="DEFECTIVE_BATCH">Lô hàng lỗi chất lượng</option>
                <option value="WRONG_SPECIFICATION">Sai mẫu mã đặt hàng</option>
                <option value="EXPIRED_ON_ARRIVAL">Hết hạn sử dụng khi nhận</option>
                <option value="EXCESS_UNORDERED">Giao dư số lượng hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý *</label>
              <select
                value={editingRTV.status || 'PENDING_SUPPLIER_APPROVAL'}
                onChange={(e) => setEditingRTV({ ...editingRTV, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="PENDING_SUPPLIER_APPROVAL">Chờ nhà cung cấp phản hồi</option>
                <option value="APPROVED_CREDIT_NOTE">Đã duyệt bồi hoàn</option>
                <option value="REPLACEMENT_DISPATCHED">Đang gửi hàng thay thế</option>
                <option value="REJECTED">Từ chối yêu cầu</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Đơn vị vận chuyển</label>
              <input
                type="text"
                value={editingRTV.logisticsCarrier || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, logisticsCarrier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mã vận đơn tracking</label>
              <input
                type="text"
                value={editingRTV.trackingNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, trackingNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nhân viên phụ trách *</label>
              <input
                type="text"
                value={editingRTV.filedBy || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, filedBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ghi chú & thỏa thuận bồi hoàn</label>
            <textarea
              rows={2}
              value={editingRTV.notes || ''}
              onChange={(e) => setEditingRTV({ ...editingRTV, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu dữ liệu
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deletingRTV}
        onClose={() => setDeletingRTV(null)}
        title="Xóa Đơn Trả Hàng Nhà Cung Cấp"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa đơn trả hàng <strong>{deletingRTV?.returnNumber}</strong> trả cho nhà cung cấp {deletingRTV?.supplierName}? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setDeletingRTV(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
