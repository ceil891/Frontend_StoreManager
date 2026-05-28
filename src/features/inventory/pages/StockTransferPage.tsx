import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, ArrowRightLeft, Building2, FileText, CheckCircle2, Truck, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockTransferOrder } from '../store/inventoryStore';

export function StockTransferPage() {
  const { stockTransfers: data, addStockTransfer, updateStockTransfer, deleteStockTransfer } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferOrder | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTransfer, setEditingTransfer] = useState<Partial<StockTransferOrder>>({});
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransferOrder | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.transferNumber.toLowerCase().includes(q) ||
        item.sourceHub.toLowerCase().includes(q) ||
        item.destinationHub.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
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
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (transfer: StockTransferOrder) => {
    setModalMode('edit');
    setEditingTransfer(transfer);
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
        notes: editingTransfer.notes || ''
      };
      addStockTransfer(newTransfer);
    } else if (editingTransfer.id) {
      updateStockTransfer(editingTransfer.id, editingTransfer);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTransfer) return;
    deleteStockTransfer(deletingTransfer.id);
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
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'destinationHub',
        header: 'Kho nhập',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalUnits',
        header: 'Số lượng',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number} sản phẩm</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'dispatchDate',
        header: 'Ngày xuất',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
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
            DISCREPANCY_HELD: 'Tạm giữ / Sai lệch',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              status === 'DISCREPANCY_HELD' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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
              onClick={(e) => { e.stopPropagation(); setSelectedTransfer(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingTransfer(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Luân chuyển Kho hàng Liên chi nhánh</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý hoạt động chuyển kho giữa các chi nhánh, điều phối đơn vị vận chuyển và đối soát hàng hóa. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Tạo phiếu chuyển kho
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
                placeholder="Tìm kiếm theo mã phiếu, kho xuất hoặc kho nhập..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái luân chuyển:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="PENDING_APPROVAL">Chờ duyệt (PENDING APPROVAL)</option>
                <option value="APPROVED_IN_TRANSIT">Đang vận chuyển (APPROVED IN TRANSIT)</option>
                <option value="COMPLETED_RECEIVED">Đã nhận hàng (COMPLETED RECEIVED)</option>
                <option value="CANCELLED_DISCREPANCY">Đã hủy/Sai lệch (CANCELLED DISCREPANCY)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedTransfer(row)} />
      </div>

      <Drawer
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        title={selectedTransfer ? `Stock Transfer: ${selectedTransfer.transferNumber}` : 'Transfer Details'}
        width="max-w-lg"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Transit Valuation</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedTransfer.totalValuation.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedTransfer.status === 'IN_TRANSIT' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedTransfer.status === 'PENDING_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                selectedTransfer.status === 'DISCREPANCY_HELD' ? 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedTransfer.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Origin Source Hub
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTransfer.sourceHub}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-500" /> Target Destination
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTransfer.destinationHub}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Transferred Units:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTransfer.totalUnits} items</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Dispatch Departure Date:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.dispatchDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Target ETA Window:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.estArrivalDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Logistics Carrier & Tracking:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedTransfer.logisticsPartner} {selectedTransfer.trackingRef && <span className="font-mono text-xs text-gray-500">({selectedTransfer.trackingRef})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Requisition Initiator:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTransfer.requestedBy}</span>
              </div>
              {selectedTransfer.approvedBy && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Approving Manager:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedTransfer.approvedBy}</span>
                </div>
              )}

              {selectedTransfer.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Transit & Cargo Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedTransfer.status === 'PENDING_APPROVAL' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Approve Stock Dispatch
                </button>
              )}
              {selectedTransfer.status === 'IN_TRANSIT' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <Truck className="w-4 h-4" /> Reconcile Arrival Stock
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> Print Outbound Manifest
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Yêu Cầu Chuyển Kho' : 'Cập Nhật Phiếu Chuyển Kho'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Phiếu (Transfer Number) *</label>
              <input
                type="text"
                value={editingTransfer.transferNumber || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, transferNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người yêu cầu / Lên đơn</label>
              <input
                type="text"
                value={editingTransfer.requestedBy || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, requestedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kho xuất (Source Hub) *</label>
              <input
                type="text"
                value={editingTransfer.sourceHub || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, sourceHub: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kho nhập (Destination Hub) *</label>
              <input
                type="text"
                value={editingTransfer.destinationHub || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, destinationHub: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày xuất kho dự kiến</label>
              <input
                type="date"
                value={editingTransfer.dispatchDate || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, dispatchDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày nhận (ETA)</label>
              <input
                type="date"
                value={editingTransfer.estArrivalDate || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, estArrivalDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng SL hàng chuyển</label>
              <input
                type="number"
                value={editingTransfer.totalUnits || 0}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, totalUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị định giá ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingTransfer.totalValuation || 0}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, totalValuation: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đối tác / Đội vận chuyển</label>
              <input
                type="text"
                value={editingTransfer.logisticsPartner || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, logisticsPartner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Tracking (Nếu có)</label>
              <input
                type="text"
                value={editingTransfer.trackingRef || ''}
                onChange={(e) => setEditingTransfer({ ...editingTransfer, trackingRef: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: FLT-001..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái luân chuyển</label>
            <select
              value={editingTransfer.status || 'DRAFT'}
              onChange={(e) => setEditingTransfer({ ...editingTransfer, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="PENDING_APPROVAL">Chờ duyệt xuất</option>
              <option value="IN_TRANSIT">Đang trên đường vận chuyển</option>
              <option value="COMPLETED">Hoàn tất (Đã nhập kho đích)</option>
              <option value="DISCREPANCY_HELD">Tạm giữ do sai lệch</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú vận đơn</label>
            <textarea
              rows={2}
              value={editingTransfer.notes || ''}
              onChange={(e) => setEditingTransfer({ ...editingTransfer, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
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
    </>
  );
}
