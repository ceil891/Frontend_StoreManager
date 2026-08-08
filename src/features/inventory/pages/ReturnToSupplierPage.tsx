import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, RotateCcw, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ReturnToSupplierItem } from '../store/inventoryStore';

interface UiReturnItem extends ReturnToSupplierItem {
  returnNumber: string;
  dispatchingStore: string;
  returnedItemsCount: number;
  claimValuation: number;
  logisticsCarrier: string;
  filedBy: string;
  trackingNumber?: string;
}

export function ReturnToSupplierPage() {
  const { 
    returnToSuppliers, 
    fetchReturnToSuppliers, 
    addReturnToSupplier, 
    updateReturnToSupplier, 
    deleteReturnToSupplier,
    products,
    fetchProducts
  } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selectedRTV, setSelectedRTV] = useState<UiReturnItem | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingRTV, setEditingRTV] = useState<Partial<UiReturnItem>>({});
  const [deletingRTV, setDeletingRTV] = useState<UiReturnItem | null>(null);

  // Product Line Items state for Return form
  const [returnItems, setReturnItems] = useState<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    reason: string;
  }[]>([
    { id: '1', productName: 'Sữa tươi Vinamilk 1L', sku: 'SKU-MILK-01', quantity: 10, unitPrice: 32000, reason: 'Hết hạn bảo quản' }
  ]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReturnToSuppliers();
    fetchProducts();
  }, [fetchReturnToSuppliers, fetchProducts]);

  // Auto calculate totals when returnItems changes
  const updateReturnItemsAndRecalculate = (newItems: typeof returnItems) => {
    setReturnItems(newItems);
    const totalQty = newItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalVal = newItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
    setEditingRTV(prev => ({
      ...prev,
      returnedItemsCount: totalQty,
      claimValuation: totalVal
    }));
  };

  const handleAddProductLine = () => {
    const firstP = products[0];
    const newItem = {
      id: Date.now().toString(),
      productName: firstP?.name || 'Sản phẩm mới',
      sku: firstP?.sku || 'SKU-NEW',
      quantity: 1,
      unitPrice: firstP?.price || 50000,
      reason: 'Lỗi chất lượng'
    };
    updateReturnItemsAndRecalculate([...returnItems, newItem]);
  };

  const handleRemoveProductLine = (id: string) => {
    updateReturnItemsAndRecalculate(returnItems.filter(i => i.id !== id));
  };

  const handleUpdateProductLine = (id: string, field: string, value: any) => {
    const updated = returnItems.map(item => {
      if (item.id !== id) return item;
      if (field === 'sku') {
        const p = products.find(prod => prod.sku === value);
        return {
          ...item,
          sku: value,
          productName: p?.name || item.productName,
          unitPrice: p?.price || item.unitPrice
        };
      }
      return { ...item, [field]: value };
    });
    updateReturnItemsAndRecalculate(updated);
  };

  const data = useMemo<UiReturnItem[]>(() => {
    return returnToSuppliers.map((r) => ({
      id: r.id,
      rtvNumber: r.rtvNumber,
      totalItems: r.totalItems,
      refundValue: r.refundValue,
      returnNumber: r.rtvNumber,
      grnRefNumber: r.grnRefNumber,
      supplierName: r.supplierName,
      dispatchingStore: 'Kho phân phối Trung tâm',
      returnDate: r.returnDate,
      returnedItemsCount: r.totalItems,
      claimValuation: r.refundValue,
      reason: r.reason as any || 'DEFECTIVE_BATCH',
      status: r.status as any || 'PENDING_SUPPLIER_APPROVAL',
      logisticsCarrier: 'Nhà xe nội địa',
      filedBy: 'Người quản lý',
      notes: r.notes,
    }));
  }, [returnToSuppliers]);

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

  const handleOpenEdit = (rtv: UiReturnItem) => {
    setFormMode('edit');
    setEditingRTV(rtv);
    setIsFormOpen(true);
  };

  const handleSaveRTV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRTV.returnNumber || !editingRTV.supplierName) return;

    const payload = {
      rtvNumber: editingRTV.returnNumber,
      grnRefNumber: editingRTV.grnRefNumber || '',
      supplierName: editingRTV.supplierName,
      dispatchingStore: editingRTV.dispatchingStore || 'Kho phân phối Trung tâm',
      returnDate: editingRTV.returnDate || new Date().toISOString().split('T')[0],
      totalItems: Number(editingRTV.returnedItemsCount) || 1,
      refundValue: Number(editingRTV.claimValuation) || 0,
      status: editingRTV.status || 'PENDING_SUPPLIER_APPROVAL',
      reason: editingRTV.reason || 'DEFECTIVE_BATCH',
      notes: editingRTV.notes || '',
    };

    if (formMode === 'create') {
      await addReturnToSupplier(payload);
    } else if (editingRTV.id) {
      await updateReturnToSupplier(editingRTV.id, payload);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRTV) return;
    await deleteReturnToSupplier(deletingRTV.id);
    setDeletingRTV(null);
    if (selectedRTV?.id === deletingRTV.id) {
      setSelectedRTV(null);
    }
  };

  const columns = useMemo<ColumnDef<UiReturnItem>[]>(
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
              <Download className="w-4 h-4" /> Xuất Dữ Liệu
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? '📦 Tạo đơn trả hàng cho NCC mới' : '⚙️ Chỉnh sửa đơn trả hàng NCC'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSaveRTV} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã trả hàng (RTV) *</label>
              <input
                type="text"
                value={editingRTV.returnNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã GRN nhập hàng gốc *</label>
              <input
                type="text"
                value={editingRTV.grnRefNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, grnRefNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="GRN-2026-XXXX"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày trả hàng *</label>
              <input
                type="date"
                value={editingRTV.returnDate || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhà cung cấp nhận *</label>
              <input
                type="text"
                value={editingRTV.supplierName || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, supplierName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tên nhà cung cấp..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho xuất trả hàng *</label>
              <input
                type="text"
                value={editingRTV.dispatchingStore || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, dispatchingStore: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Kho phân phối Trung tâm, Kho Q1..."
                required
              />
            </div>
          </div>

          {/* Section Bảng Sản Phẩm Trả NCC */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách sản phẩm xuất trả NCC ({returnItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddProductLine}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Sản Phẩm trả
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-24 text-center">Số lượng</th>
                    <th className="p-2 w-32 text-right">Đơn giá nhập</th>
                    <th className="p-2 w-44">Lý do lỗi / Trả</th>
                    <th className="p-2 w-32 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {returnItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateProductLine(item.id, 'sku', e.target.value)}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-900 text-xs font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                          ))}
                          {!products.some(p => p.sku === item.sku) && (
                            <option value={item.sku}>{item.sku} - {item.productName}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateProductLine(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateProductLine(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => handleUpdateProductLine(item.id, 'reason', e.target.value)}
                          className="w-full p-1 border rounded"
                          placeholder="Nhập lý do trả..."
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                        {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProductLine(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Tổng số lượng trả: <span className="font-mono text-base">{editingRTV.returnedItemsCount || 0}</span> đơn vị
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Tổng giá trị hoàn tiền: <span className="font-mono text-base text-emerald-600 font-extrabold">{(editingRTV.claimValuation || 0).toLocaleString('vi-VN')} ₫</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phân loại lý do trả *</label>
              <select
                value={editingRTV.reason || 'DEFECTIVE_BATCH'}
                onChange={(e) => setEditingRTV({ ...editingRTV, reason: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="DEFECTIVE_BATCH">Lô hàng lỗi chất lượng</option>
                <option value="WRONG_SPECIFICATION">Sai mẫu mã đặt hàng</option>
                <option value="EXPIRED_ON_ARRIVAL">Hết hạn sử dụng khi nhận</option>
                <option value="EXCESS_UNORDERED">Giao dư số lượng hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái xử lý *</label>
              <select
                value={editingRTV.status || 'PENDING_SUPPLIER_APPROVAL'}
                onChange={(e) => setEditingRTV({ ...editingRTV, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="PENDING_SUPPLIER_APPROVAL">Chờ nhà cung cấp phản hồi</option>
                <option value="APPROVED_CREDIT_NOTE">Đã duyệt bồi hoàn</option>
                <option value="REPLACEMENT_DISPATCHED">Đang gửi hàng thay thế</option>
                <option value="REJECTED">Từ chối yêu cầu</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhân viên phụ trách *</label>
              <input
                type="text"
                value={editingRTV.filedBy || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, filedBy: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đơn vị vận chuyển</label>
              <input
                type="text"
                value={editingRTV.logisticsCarrier || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, logisticsCarrier: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã vận đơn tracking</label>
              <input
                type="text"
                value={editingRTV.trackingNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, trackingNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú & thỏa thuận bồi hoàn</label>
            <textarea
              rows={2}
              value={editingRTV.notes || ''}
              onChange={(e) => setEditingRTV({ ...editingRTV, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
        title="Xóa đơn trả hàng nhà cung cấp"
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
