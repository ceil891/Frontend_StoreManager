import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Download, Search, Eye, ArrowRightLeft, Building2, FileText, 
  CheckCircle2, Truck, Edit, Trash2, X, AlertTriangle, ShieldAlert, 
  HelpCircle, Info, Calendar, Sparkles, Tag, Layers 
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockTransferOrder } from '../store/inventoryStore';
import { toast } from 'sonner';

export function StockTransferPage() {
  const { 
    stockTransfers: data, 
    addStockTransfer, 
    updateStockTransfer, 
    deleteStockTransfer, 
    fetchStockTransfers,
    approveStockTransfer,
    shipStockTransfer,
    completeStockTransfer
  } = useInventoryStore();

  useEffect(() => {
    fetchStockTransfers();
  }, [fetchStockTransfers]);

  const [search, setSearch] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferOrder | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTransfer, setEditingTransfer] = useState<Partial<StockTransferOrder>>({});
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransferOrder | null>(null);

  const filtered = data.filter((item) => {
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.transferNumber.toLowerCase().includes(q) ||
        item.sourceHub.toLowerCase().includes(q) ||
        item.destinationHub.toLowerCase().includes(q)
      );
    }
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setEditingTransfer({
      transferNumber: `STX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      sourceHub: 'Main Flagship / HQ',
      destinationHub: '',
      dispatchDate: today,
      estArrivalDate: tomorrow.toISOString().split('T')[0],
      totalUnits: 0,
      totalValuation: 0,
      status: 'DRAFT',
      logisticsPartner: 'Internal Express Fleet',
      trackingRef: '',
      requestedBy: 'System User',
      approvedBy: '',
      notes: '',
      priority: 'MEDIUM',
      reason: 'REBALANCE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (transfer: StockTransferOrder) => {
    setModalMode('edit');
    setEditingTransfer({
      ...transfer,
      priority: transfer.priority || 'MEDIUM',
      reason: transfer.reason || 'REBALANCE',
    });
    setIsModalOpen(true);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer.transferNumber || !editingTransfer.destinationHub) return;

    if (modalMode === 'create') {
      const newTransfer: Omit<StockTransferOrder, 'id'> = {
        transferNumber: editingTransfer.transferNumber,
        sourceHub: editingTransfer.sourceHub || 'HQ',
        destinationHub: editingTransfer.destinationHub,
        dispatchDate: editingTransfer.dispatchDate || '',
        estArrivalDate: editingTransfer.estArrivalDate || '',
        totalUnits: Number(editingTransfer.totalUnits) || 0,
        totalValuation: Number(editingTransfer.totalValuation) || 0,
        status: editingTransfer.status as any || 'DRAFT',
        logisticsPartner: editingTransfer.logisticsPartner || 'Internal',
        trackingRef: editingTransfer.trackingRef || '',
        requestedBy: editingTransfer.requestedBy || 'User',
        approvedBy: editingTransfer.approvedBy || '',
        notes: editingTransfer.notes || '',
        priority: editingTransfer.priority || 'MEDIUM',
        reason: editingTransfer.reason || 'REBALANCE',
      };
      addStockTransfer(newTransfer);
      toast.success('Đã khởi tạo lệnh chuyển kho mới!');
    } else if (editingTransfer.id) {
      updateStockTransfer(editingTransfer.id, editingTransfer);
      toast.success('Đã lưu cập nhật phiếu chuyển kho!');
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTransfer) return;
    deleteStockTransfer(deletingTransfer.id);
    toast.success('Đã hủy phiếu chuyển kho thành công.');
    setDeletingTransfer(null);
  };

  const columns = useMemo<ColumnDef<StockTransferOrder>[]>(
    () => [
      {
        accessorKey: 'transferNumber',
        header: 'Mã phiếu chuyển',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sourceHub',
        header: 'Kho xuất',
        cell: (info) => <span className="font-medium text-gray-905 dark:text-gray-150">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'destinationHub',
        header: 'Kho nhập',
        cell: (info) => <span className="font-medium text-gray-905 dark:text-gray-150">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'priority',
        header: 'Độ ưu tiên',
        cell: (info) => {
          const val = info.getValue() as string;
          let colorCls = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
          let label = 'Trung bình';
          if (val === 'HIGH') {
            colorCls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
            label = 'Cao';
          } else if (val === 'LOW') {
            colorCls = 'bg-gray-55 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800';
            label = 'Thấp';
          }
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorCls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {label}
            </span>
          );
        }
      },
      {
        accessorKey: 'totalUnits',
        header: 'Số lượng',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number} items</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            DRAFT: 'Bản nháp',
            PENDING_APPROVAL: 'Chờ duyệt',
            IN_TRANSIT: 'Đang vận chuyển',
            COMPLETED: 'Đã hoàn thành',
            REJECTED: 'Từ chối',
            DISCREPANCY_HELD: 'Sai lệch',
            CANCELLED: 'Đã hủy',
          };
          let colorCls = 'bg-gray-100 text-gray-800';
          if (status === 'COMPLETED') colorCls = 'bg-emerald-100 text-emerald-800 border-emerald-250';
          else if (status === 'IN_TRANSIT') colorCls = 'bg-blue-100 text-blue-800 border-blue-250';
          else if (status === 'PENDING_APPROVAL') colorCls = 'bg-amber-100 text-amber-800 border-amber-250';
          else if (status === 'DISCREPANCY_HELD') colorCls = 'bg-rose-100 text-rose-800 border-rose-250';
          else if (status === 'REJECTED' || status === 'CANCELLED') colorCls = 'bg-red-100 text-red-800 border-red-250';

          return (
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorCls}`}>
              {statusMap[status] || status}
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
              onClick={() => setSelectedTransfer(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingTransfer(row.original)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Hủy đơn"
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
            Lệnh điều chuyển vị trí kho (Transfers)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Điều động luân chuyển hàng hóa nội bộ giữa các bãi kho, chi nhánh hoặc khu vực lưu trữ.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold text-sm shadow-sm whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" /> Tạo Yêu Cầu Chuyển Kho
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-750 flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã phiếu, kho xuất, kho nhập..."
              className="bg-transparent outline-none text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="IN_TRANSIT">Đang vận chuyển</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedTransfer(row)} />
      </div>

      {/* Drawer Xem Chi Tiết */}
      <Modal
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        title={selectedTransfer ? `Lệnh điều chuyển: ${selectedTransfer.transferNumber}` : 'Chi tiết lệnh chuyển kho'}
        width="max-w-lg"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold animate-pulse">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Trị giá luân chuyển</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTransfer.totalValuation)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTransfer.status === 'COMPLETED' || selectedTransfer.status === 'RECEIVED' ? 'bg-emerald-250 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedTransfer.status === 'IN_TRANSIT' || selectedTransfer.status === 'SHIPPED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedTransfer.status === 'PENDING_APPROVAL' ? 'bg-amber-250 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                selectedTransfer.status === 'APPROVED' ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-850 dark:text-indigo-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedTransfer.status === 'COMPLETED' || selectedTransfer.status === 'RECEIVED' ? 'ĐÃ HOÀN THÀNH' :
                 selectedTransfer.status === 'IN_TRANSIT' || selectedTransfer.status === 'SHIPPED' ? 'ĐANG VẬN CHUYỂN' :
                 selectedTransfer.status === 'PENDING_APPROVAL' ? 'CHỜ DUYỆT' :
                 selectedTransfer.status === 'APPROVED' ? 'ĐÃ DUYỆT' : selectedTransfer.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bãi kho xuất
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTransfer.sourceHub}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-500" /> Bãi kho đích
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTransfer.destinationHub}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Độ ưu tiên:</span>
                <span className={`font-bold ${selectedTransfer.priority === 'HIGH' ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedTransfer.priority === 'HIGH' ? '🔴 Cao' : selectedTransfer.priority === 'LOW' ? '🔵 Thấp' : '🟡 Trung bình'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lý do điều chuyển:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedTransfer.reason === 'RESTOCK' ? 'Bổ sung tồn kho' :
                   selectedTransfer.reason === 'REBALANCE' ? 'Điều chuyển nội bộ' :
                   selectedTransfer.reason === 'PROMO' ? 'Chương trình khuyến mãi' :
                   selectedTransfer.reason === 'LAYOUT_CHANGE' ? 'Thay đổi Layout' : 'Khác'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Số lượng điều động:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTransfer.totalUnits} sản phẩm</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Ngày xuất departure:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.dispatchDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">ETA Dự kiến đến:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.estArrivalDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Đơn vị vận chuyển:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedTransfer.logisticsPartner} {selectedTransfer.trackingRef && <span className="font-mono text-xs text-gray-500">({selectedTransfer.trackingRef})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Nhân viên đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.requestedBy}</span>
              </div>
              {selectedTransfer.approvedBy && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Quản trị duyệt:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedTransfer.approvedBy}</span>
                </div>
              )}

              {selectedTransfer.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Chỉ dẫn</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{selectedTransfer.notes}"</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedTransfer.status === 'PENDING_APPROVAL' && (
                <button
                  onClick={async () => {
                    try {
                      await approveStockTransfer(selectedTransfer.id);
                      setSelectedTransfer(prev => prev ? { ...prev, status: 'APPROVED' } : null);
                      toast.success('Đã duyệt lệnh điều chuyển!');
                    } catch (err) {
                      toast.error('Lỗi khi duyệt lệnh điều chuyển');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Phê duyệt lệnh xuất
                </button>
              )}
              {selectedTransfer.status === 'APPROVED' && (
                <button
                  onClick={async () => {
                    try {
                      await shipStockTransfer(selectedTransfer.id);
                      setSelectedTransfer(prev => prev ? { ...prev, status: 'SHIPPED' } : null);
                      toast.success('Đã xuất kho và bắt đầu vận chuyển!');
                    } catch (err) {
                      toast.error('Lỗi khi xuất kho vận chuyển');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <Truck className="w-4 h-4" /> Bắt đầu xuất kho vận chuyển
                </button>
              )}
              {(selectedTransfer.status === 'IN_TRANSIT' || selectedTransfer.status === 'SHIPPED') && (
                <button
                  onClick={async () => {
                    try {
                      await completeStockTransfer(selectedTransfer.id);
                      setSelectedTransfer(prev => prev ? { ...prev, status: 'RECEIVED' } : null);
                      toast.success('Đã xác nhận nhận hàng và nhập kho đích thành công!');
                    } catch (err) {
                      toast.error('Lỗi khi nhận hàng nhập kho');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận đã nhận hàng
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> In phiếu bàn giao
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal (Góp ý 4 + 5) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📦 Khởi tạo yêu cầu chuyển kho mới' : '⚙️ Cập nhật phiếu chuyển kho'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4 text-xs">
          
          {/* Card 1: Thông tin chung */}
          <div className="p-3 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> Thông tin chung phiếu điều động
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã phiếu (transfer number) *</label>
                <input
                  type="text"
                  value={editingTransfer.transferNumber || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, transferNumber: e.target.value })}
                  className="w-full mt-1 p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Nhân viên lên đơn</label>
                <input
                  type="text"
                  value={editingTransfer.requestedBy || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, requestedBy: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Bãi kho xuất (Origin Hub) *</label>
                <input
                  type="text"
                  value={editingTransfer.sourceHub || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, sourceHub: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Bãi kho đích (Destination Hub) *</label>
                <input
                  type="text"
                  value={editingTransfer.destinationHub || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, destinationHub: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                  required
                />
              </div>
            </div>

            {/* WMS: Priority and Transfer Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mức độ ưu tiên (Priority) *</label>
                <select
                  value={editingTransfer.priority || 'MEDIUM'}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, priority: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                >
                  <option value="HIGH">🔴 Cao (Xử lý gấp)</option>
                  <option value="MEDIUM">🟡 Trung bình</option>
                  <option value="LOW">🔵 Thấp (Bổ sung kho thường)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Lý do điều chuyển hàng *</label>
                <select
                  value={editingTransfer.reason || 'REBALANCE'}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, reason: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                >
                  <option value="RESTOCK">Bổ sung tồn kho</option>
                  <option value="REBALANCE">Dịch chuyển layout / Nội bộ</option>
                  <option value="PROMO">Phục vụ chương trình khuyến mãi</option>
                  <option value="LAYOUT_CHANGE">Đổi sơ đồ kệ (Layout Change)</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Logistics */}
          <div className="p-3 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-500" /> Logistics & Đội vận chuyển
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Ngày xuất bãi</label>
                <input
                  type="date"
                  value={editingTransfer.dispatchDate || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, dispatchDate: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Ngày đến dự kiến (ETA)</label>
                <input
                  type="date"
                  value={editingTransfer.estArrivalDate || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, estArrivalDate: e.target.value })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Đối tác vận chuyển</label>
                <input
                  type="text"
                  value={editingTransfer.logisticsPartner || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, logisticsPartner: e.target.value })}
                  placeholder="Ví dụ: Internal Express Fleet..."
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã vận đơn / Tracking Ref</label>
                <input
                  type="text"
                  value={editingTransfer.trackingRef || ''}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, trackingRef: e.target.value })}
                  placeholder="Ví dụ: FLT-XXXX"
                  className="w-full mt-1 p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Chi tiết hàng & Ghi chú */}
          <div className="p-3 bg-gray-50/70 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> Số lượng hàng hóa & Trạng thái duyệt
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Số lượng chuyển</label>
                <input
                  type="number"
                  value={editingTransfer.totalUnits || 0}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, totalUnits: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tổng trị giá (VNĐ)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTransfer.totalValuation || 0}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, totalValuation: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Trạng thái luân chuyển *</label>
                <select
                  value={editingTransfer.status || 'DRAFT'}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, status: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded dark:bg-gray-950 dark:border-gray-700 font-semibold"
                >
                  <option value="DRAFT">Bản nháp (Draft)</option>
                  <option value="PENDING_APPROVAL">Chờ duyệt xuất</option>
                  <option value="IN_TRANSIT">Đang vận chuyển</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                  <option value="REJECTED">Từ chối (Rejected)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú & Chỉ dẫn xếp dỡ</label>
              <textarea
                rows={2}
                value={editingTransfer.notes || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, notes: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs resize-none"
                placeholder="Ví dụ: Hàng dễ vỡ, giữ thăng bằng..."
              />
            </div>
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
              {modalMode === 'create' ? 'Tạo phiếu' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingTransfer}
        onClose={() => setDeletingTransfer(null)}
        title="Xác nhận hủy Phiếu Chuyển Kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn hủy / xóa lệnh chuyển kho <strong className="text-gray-900 dark:text-white">{deletingTransfer?.transferNumber}</strong> không? Cảnh báo: Các mặt hàng sẽ được trả lại kho xuất.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingTransfer(null)}
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
    </div>
  );
}
export default StockTransferPage;
