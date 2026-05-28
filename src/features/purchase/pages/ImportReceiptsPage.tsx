import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, Box, Edit, Trash2, X, Package, Clock, TrendingUp } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePurchaseStore, type ImportReceiptItem } from '../store/purchaseStore';

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export function ImportReceiptsPage() {
  const { importReceipts: data, addImportReceipt, updateImportReceipt, deleteImportReceipt } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ImportReceiptItem | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingReceipt, setEditingReceipt] = useState<Partial<ImportReceiptItem>>({});
  const [deletingReceipt, setDeletingReceipt] = useState<ImportReceiptItem | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.supplierName.toLowerCase().includes(q) ||
        item.grnNumber.toLowerCase().includes(q) ||
        item.poNumber.toLowerCase().includes(q) ||
        item.receivingStore.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingReceipt({
      grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      poNumber: `PO-${new Date().getFullYear()}-...`,
      supplierName: '',
      receivingStore: 'Main Flagship / HQ',
      receivedDate: new Date().toISOString().split('T')[0],
      totalItems: 0,
      acceptedItems: 0,
      rejectedItems: 0,
      totalValuation: 0,
      status: 'PENDING_INSPECTION',
      inspectedBy: 'Warehouse Staff',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (receipt: ImportReceiptItem) => {
    setModalMode('edit');
    setEditingReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt.grnNumber || !editingReceipt.supplierName) return;

    if (modalMode === 'create') {
      const newReceipt: Omit<ImportReceiptItem, 'id'> = {
        grnNumber: editingReceipt.grnNumber,
        poNumber: editingReceipt.poNumber || '',
        supplierName: editingReceipt.supplierName,
        receivingStore: editingReceipt.receivingStore || 'Main Flagship / HQ',
        receivedDate: editingReceipt.receivedDate || new Date().toISOString().split('T')[0],
        totalItems: Number(editingReceipt.totalItems) || 0,
        acceptedItems: Number(editingReceipt.acceptedItems) || 0,
        rejectedItems: Number(editingReceipt.rejectedItems) || 0,
        totalValuation: Number(editingReceipt.totalValuation) || 0,
        status: editingReceipt.status as any || 'PENDING_INSPECTION',
        inspectedBy: editingReceipt.inspectedBy || 'Warehouse Staff',
        notes: editingReceipt.notes || ''
      };
      addImportReceipt(newReceipt);
    } else if (editingReceipt.id) {
      updateImportReceipt(editingReceipt.id, editingReceipt);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingReceipt) return;
    deleteImportReceipt(deletingReceipt.id);
    setDeletingReceipt(null);
  };

  const columns = useMemo<ColumnDef<ImportReceiptItem>[]>(
    () => [
      {
        accessorKey: 'grnNumber',
        header: 'Phiếu nhập kho (GRN)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poNumber',
        header: 'Mã PO đối chiếu',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'receivingStore',
        header: 'Kho / Chi nhánh nhận',
      },
      {
        accessorKey: 'totalItems',
        header: 'Số lượng nhập',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.totalItems}</span>
            {row.original.rejectedItems > 0 && <span className="ml-1 text-xs text-red-600">(-{row.original.rejectedItems} lỗi)</span>}
          </div>
        ),
      },
      {
        accessorKey: 'receivedDate',
        header: 'Ngày nhận hàng',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái kiểm tra',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            INSPECTED_ACCEPTED: 'Đạt yêu cầu',
            PARTIAL_ACCEPTANCE: 'Nhận một phần',
            PENDING_INSPECTION: 'Chờ kiểm tra',
            REJECTED: 'Từ chối nhận',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'INSPECTED_ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PARTIAL_ACCEPTANCE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING_INSPECTION' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedReceipt(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingReceipt(row.original); }}
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

  // KPI summary
  const totalPending   = data.filter(r => r.status === 'PENDING_INSPECTION').length;
  const totalAccepted  = data.filter(r => r.status === 'INSPECTED_ACCEPTED').length;
  const totalValue     = data.reduce((s, r) => s + r.totalValuation, 0);
  const totalItems     = data.reduce((s, r) => s + r.acceptedItems, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu Nhập kho (GRN)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ghi nhận và kiểm duyệt các đợt hàng nhập kho từ nhà cung cấp. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Tạo phiếu nhập kho
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Chờ kiểm tra</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalPending}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Đã nhập kho</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalAccepted}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng SL đạt chuẩn</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalItems.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng giá trị nhập</p>
              <p className="text-base font-black text-gray-900 dark:text-white">{(totalValue / 1000000).toFixed(0)}M</p>
            </div>
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
                placeholder="Tìm kiếm theo mã GRN, mã PO hoặc nhà cung cấp..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái phiếu:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_INSPECTION">Chờ kiểm định (PENDING INSPECTION)</option>
                <option value="PARTIALLY_ACCEPTED">Nhận một phần (PARTIALLY ACCEPTED)</option>
                <option value="FULLY_COMPLETED_STOCKED">Đã nhập kho (FULLY COMPLETED STOCKED)</option>
                <option value="REJECTED_RETURNED">Đã từ chối/Trả lại (REJECTED RETURNED)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedReceipt(row)} />
      </div>

      <Drawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Chi tiết Phiếu nhập: ${selectedReceipt.grnNumber}` : 'Chi tiết phiếu nhập kho'}
        width="max-w-lg"
      >
        {selectedReceipt && (() => {
          const statusMap: Record<string, { label: string; cls: string }> = {
            INSPECTED_ACCEPTED: { label: 'Đã nhập kho', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            PARTIAL_ACCEPTANCE: { label: 'Nhận một phần', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            PENDING_INSPECTION: { label: 'Chờ kiểm tra', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            REJECTED: { label: 'Từ chối nhận', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
          };
          const cfg = statusMap[selectedReceipt.status] || { label: selectedReceipt.status, cls: 'bg-gray-100 text-gray-700' };
          const acceptRate = selectedReceipt.totalItems > 0
            ? Math.round((selectedReceipt.acceptedItems / selectedReceipt.totalItems) * 100)
            : 0;
          return (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng giá trị lô hàng</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{fmtVND(selectedReceipt.totalValuation)}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
            </div>

            {/* Supplier & date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Building2 className="w-3.5 h-3.5" /> Nhà cung cấp</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedReceipt.supplierName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5" /> Ngày nhận hàng</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedReceipt.receivedDate}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-sm overflow-hidden">
              {[
                { label: 'Mã PO đối chiếu', value: <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedReceipt.poNumber}</span> },
                { label: 'Kho / Chi nhánh nhận', value: selectedReceipt.receivingStore },
                { label: 'Tổng SL giao đến', value: `${selectedReceipt.totalItems} sản phẩm` },
                { label: 'SL đạt chuẩn', value: <span className="text-emerald-600 font-semibold">{selectedReceipt.acceptedItems} sp</span> },
                { label: 'SL lỗi / trả lại', value: selectedReceipt.rejectedItems > 0 ? <span className="text-red-600 font-semibold">{selectedReceipt.rejectedItems} sp</span> : <span className="text-gray-400">Không có</span> },
                { label: 'Người kiểm tra (QA)', value: selectedReceipt.inspectedBy },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Accept rate bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Tỷ lệ chấp nhận hàng</span>
                <span className={`font-bold ${acceptRate >= 90 ? 'text-emerald-600' : acceptRate >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{acceptRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${acceptRate >= 90 ? 'bg-emerald-500' : acceptRate >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${acceptRate}%` }} />
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Ghi chú kiểm hàng</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedReceipt.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedReceipt.status === 'PENDING_INSPECTION' && (
                <button
                  onClick={() => {
                    updateImportReceipt(selectedReceipt.id, { status: 'INSPECTED_ACCEPTED' });
                    setSelectedReceipt(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận đã nhập kho
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> In phiếu GRN
              </button>
            </div>
          </div>
          );
        })()}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Phiếu Nhập Kho (GRN)' : 'Cập Nhật Phiếu Nhập Kho'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Phiếu Nhập (GRN) *</label>
              <input
                type="text"
                value={editingReceipt.grnNumber || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, grnNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã PO Đối chiếu</label>
              <input
                type="text"
                value={editingReceipt.poNumber || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, poNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: PO-2024-..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp *</label>
              <input
                type="text"
                value={editingReceipt.supplierName || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, supplierName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Kho nhận</label>
              <input
                type="text"
                value={editingReceipt.receivingStore || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, receivingStore: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày nhập thực tế</label>
              <input
                type="date"
                value={editingReceipt.receivedDate || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm tra (QA)</label>
              <input
                type="text"
                value={editingReceipt.inspectedBy || ''}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, inspectedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng SL giao</label>
              <input
                type="number"
                value={editingReceipt.totalItems || 0}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, totalItems: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-emerald-600">SL Đạt chuẩn</label>
              <input
                type="number"
                value={editingReceipt.acceptedItems || 0}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, acceptedItems: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-red-600">SL Lỗi / Trả lại</label>
              <input
                type="number"
                value={editingReceipt.rejectedItems || 0}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, rejectedItems: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái kiểm tra</label>
              <select
                value={editingReceipt.status || 'PENDING_INSPECTION'}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PENDING_INSPECTION">Chờ kiểm tra (QA)</option>
                <option value="INSPECTED_ACCEPTED">Đã kiểm và Nhận đủ</option>
                <option value="PARTIAL_ACCEPTANCE">Nhận một phần (Có lỗi)</option>
                <option value="REJECTED">Từ chối nhận toàn bộ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị nhập ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingReceipt.totalValuation || 0}
                onChange={(e) => setEditingReceipt({ ...editingReceipt, totalValuation: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú (Biên bản lỗi, v.v.)</label>
            <textarea
              rows={2}
              value={editingReceipt.notes || ''}
              onChange={(e) => setEditingReceipt({ ...editingReceipt, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Ghi rõ lý do nếu có hàng lỗi, hàng thiếu..."
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
              {modalMode === 'create' ? 'Lưu Phiếu Nhập' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingReceipt}
        onClose={() => setDeletingReceipt(null)}
        title="Xác nhận xóa Phiếu Nhập"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa phiếu nhập kho <strong className="text-gray-900 dark:text-white">{deletingReceipt?.grnNumber}</strong> không? Hành động này sẽ ảnh hưởng đến lịch sử đối soát và không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingReceipt(null)}
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
