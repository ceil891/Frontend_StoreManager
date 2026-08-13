import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, RotateCcw, Edit, Trash2, X, PackageCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ReturnToSupplierItem } from '../store/inventoryStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';
import { toast } from 'sonner';

interface UiReturnItem extends ReturnToSupplierItem {
  returnNumber: string;
  dispatchingStore: string;
  returnedItemsCount: number;
  claimValuation: number;
  logisticsCarrier: string;
  filedBy: string;
  trackingNumber?: string;
  supplierId?: string | number;
}

export function ReturnToSupplierPage() {
  const { 
    returnToSuppliers, 
    fetchReturnToSuppliers, 
    addReturnToSupplier, 
    updateReturnToSupplier, 
    deleteReturnToSupplier,
    products,
    fetchProducts,
    importReceipts,
    fetchImportReceipts,
  } = useInventoryStore();

  const { suppliers, fetchSuppliers } = usePurchaseStore();

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
    productId?: string | number;
    quantity: number;
    unitPrice: number;
    reason: string;
  }>([
    { id: '1', productName: 'Sữa tươi Vinamilk 1L', sku: 'SKU-MILK-01', productId: '1', quantity: 10, unitPrice: 32000, reason: 'Hết hạn bảo quản' }
  ]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReturnToSuppliers();
    fetchProducts();
    fetchSuppliers();
    if (fetchImportReceipts) fetchImportReceipts();
  }, [fetchReturnToSuppliers, fetchProducts, fetchSuppliers, fetchImportReceipts]);

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

  const handleSelectGRN = (grnCode: string) => {
    const foundReceipt = (importReceipts || []).find((rec: any) => rec.code === grnCode || rec.receiptNumber === grnCode || `GRN-${rec.id}` === grnCode);
    if (!foundReceipt) {
      setEditingRTV(prev => ({ ...prev, grnRefNumber: grnCode }));
      return;
    }

    const supplierName = (foundReceipt as any).supplierName || (foundReceipt as any).supplier?.name || editingRTV.supplierName;
    const supplierId = (foundReceipt as any).supplierId || (foundReceipt as any).supplier?.id || editingRTV.supplierId;

    const lines = (foundReceipt as any).receiptLines || (foundReceipt as any).items || [];
    const mappedItems = lines.map((item: any, idx: number) => ({
      id: String(idx + 1),
      productName: item.productName || item.name || 'Sản phẩm ' + (idx + 1),
      sku: item.sku || `SKU-${idx + 1}`,
      productId: item.productId || item.productVariantId || item.id || 1,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.costPrice || 50000),
      reason: 'Lô hàng lỗi chất lượng',
    }));

    setEditingRTV(prev => ({
      ...prev,
      grnRefNumber: grnCode,
      supplierName: supplierName || prev.supplierName,
      supplierId: supplierId || prev.supplierId,
    }));

    if (mappedItems.length > 0) {
      updateReturnItemsAndRecalculate(mappedItems);
      toast.success(`Đã nạp ${mappedItems.length} sản phẩm từ phiếu nhập ${grnCode}`);
    }
  };

  const handleAddProductLine = () => {
    const firstP = products[0];
    const newItem = {
      id: Date.now().toString(),
      productName: firstP?.name || 'Sản phẩm mới',
      sku: firstP?.sku || 'SKU-NEW',
      productId: firstP?.id || '1',
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
          productId: p?.id || item.productId,
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
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingRTV({
      returnNumber: `RTV-${Date.now().toString().slice(-6)}`,
      grnRefNumber: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: suppliers[0]?.name || suppliers[0]?.companyName || 'Công ty TNHH Hà Nội',
      supplierId: suppliers[0]?.id || 1,
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
    if (!editingRTV.returnNumber || !editingRTV.supplierName) {
      toast.error('Vui lòng điền đủ Mã trả hàng và Nhà cung cấp');
      return;
    }

    const matchedSupplier = suppliers.find(s => s.name === editingRTV.supplierName || s.companyName === editingRTV.supplierName || String(s.id) === String(editingRTV.supplierId));
    const resolvedSupplierId = matchedSupplier?.id || editingRTV.supplierId || 1;

    const payload = {
      rtvNumber: editingRTV.returnNumber,
      grnRefNumber: editingRTV.grnRefNumber || '',
      supplierId: resolvedSupplierId,
      supplierName: editingRTV.supplierName,
      dispatchingStore: editingRTV.dispatchingStore || 'Kho phân phối Trung tâm',
      returnDate: editingRTV.returnDate || new Date().toISOString().split('T')[0],
      totalItems: returnItems.reduce((acc, cur) => acc + (cur.quantity || 0), 0),
      refundValue: returnItems.reduce((acc, cur) => acc + (cur.quantity * cur.unitPrice), 0),
      status: editingRTV.status || 'PENDING_SUPPLIER_APPROVAL',
      reason: editingRTV.reason || 'DEFECTIVE_BATCH',
      logisticsCarrier: editingRTV.logisticsCarrier || '',
      trackingNumber: editingRTV.trackingNumber || '',
      filedBy: editingRTV.filedBy || 'Người quản lý',
      notes: editingRTV.notes || '',
      items: returnItems,
      returnLines: returnItems,
    };

    try {
      if (formMode === 'create') {
        await addReturnToSupplier(payload);
        toast.success('Tạo đơn trả hàng cho NCC thành công!');
      } else if (editingRTV.id) {
        await updateReturnToSupplier(editingRTV.id, payload);
        toast.success('Cập nhật đơn trả hàng NCC thành công!');
      }
      setIsFormOpen(false);
      fetchReturnToSuppliers();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu đơn trả hàng NCC.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRTV) return;
    try {
      await deleteReturnToSupplier(deletingRTV.id);
      toast.success('Đã xóa đơn trả hàng NCC!');
      setDeletingRTV(null);
      if (selectedRTV?.id === deletingRTV.id) {
        setSelectedRTV(null);
      }
      fetchReturnToSuppliers();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa đơn trả hàng NCC.');
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
        header: 'Kho xuất trả',
        cell: (info) => <span className="text-gray-600 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'returnedItemsCount',
        header: 'SL sản phẩm',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'claimValuation',
        header: 'Giá trị bồi hoàn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const st = info.getValue() as string;
          const label = st === 'APPROVED_CREDIT_NOTE' ? 'Đã duyệt bồi hoàn' : (st === 'REJECTED' ? 'Từ chối' : 'Chờ NCC phản hồi');
          const style = st === 'APPROVED_CREDIT_NOTE' ? 'bg-emerald-100 text-emerald-800' : (st === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800');
          return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${style}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedRTV(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeletingRTV(row.original)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
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
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trả Hàng Nhà Cung Cấp (RTV - Return to Vendor)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý xuất trả hàng lỗi, hết hạn cho nhà cung cấp và theo dõi Credit Note bồi hoàn.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.success('Xuất log đơn RTV thành công!')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Log RTV
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo đơn trả hàng cho NCC mới
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
              placeholder="Tìm kiếm mã RTV, mã GRN, tên NCC..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedRTV(row)} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedRTV}
        onClose={() => setSelectedRTV(null)}
        title={selectedRTV ? `Chi tiết đơn RTV: ${selectedRTV.returnNumber}` : 'Chi tiết RTV'}
        width="max-w-2xl"
      >
        {selectedRTV && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase">Tổng giá trị bồi hoàn</span>
                <p className="text-2xl font-black text-emerald-600">{selectedRTV.claimValuation.toLocaleString('vi-VN')} ₫</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">
                {selectedRTV.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-400 block">Nhà cung cấp:</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedRTV.supplierName}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-400 block">Mã GRN gốc:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">{selectedRTV.grnRefNumber}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-400 block">Kho xuất trả:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.dispatchingStore}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-400 block">Ngày tạo:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedRTV.returnDate}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM CREATE / EDIT RTV MODAL */}
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
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã GRN nhập hàng gốc *</label>
              <select
                value={editingRTV.grnRefNumber || ''}
                onChange={(e) => handleSelectGRN(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                required
              >
                <option value="">-- Chọn GRN từ hệ thống --</option>
                {(importReceipts || []).map((grn: any) => (
                  <option key={grn.id} value={grn.code || grn.receiptNumber || `GRN-${grn.id}`}>
                    {grn.code || `GRN-${grn.id}`} - {grn.supplierName || 'NCC'} ({grn.receiptDate || 'Hôm nay'})
                  </option>
                ))}
              </select>
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
              <select
                value={editingRTV.supplierName || ''}
                onChange={(e) => {
                  const name = e.target.value;
                  const matched = suppliers.find(s => s.name === name || s.companyName === name);
                  setEditingRTV({ ...editingRTV, supplierName: name, supplierId: matched?.id || 1 });
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-xs"
                required
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name || s.companyName}>
                    {s.name || s.companyName} ({s.code || `SUP-${s.id}`})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho xuất trả hàng *</label>
              <select
                value={editingRTV.dispatchingStore || 'Kho phân phối Trung tâm'}
                onChange={(e) => setEditingRTV({ ...editingRTV, dispatchingStore: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              >
                <option value="Kho phân phối Trung tâm">Kho phân phối Trung tâm (Hà Nội)</option>
                <option value="Kho Chi nhánh Quận 1">Kho Chi nhánh Quận 1 (TP.HCM)</option>
                <option value="Kho tổng miền Trung">Kho tổng miền Trung (Đà Nẵng)</option>
              </select>
            </div>
          </div>

          {/* Section Bảng Sản Phẩm Trả NCC */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 DANH SÁCH SẢN PHẨM XUẤT TRẢ NCC ({returnItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddProductLine}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Sản Phẩm trả
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2">SẢN PHẨM / SKU</th>
                    <th className="p-2 w-24 text-center">SỐ LƯỢNG</th>
                    <th className="p-2 w-32 text-right">ĐƠN GIÁ NHẬP</th>
                    <th className="p-2 w-44">LÝ DO LỖI / TRẢ</th>
                    <th className="p-2 w-32 text-right">THÀNH TIỀN</th>
                    <th className="p-2 w-10 text-center">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {returnItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateProductLine(item.id, 'sku', e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs font-medium"
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
                          className="w-full p-1.5 border rounded text-center font-bold text-emerald-600"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateProductLine(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-1.5 border rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => handleUpdateProductLine(item.id, 'reason', e.target.value)}
                          className="w-full p-1.5 border rounded"
                          placeholder="Nhập lý do trả..."
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono text-sm">
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

            <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">
                Tổng số lượng trả: <span className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400">{editingRTV.returnedItemsCount || 0}</span> đơn vị
              </span>
              <span className="font-bold text-emerald-900 dark:text-emerald-300">
                Tổng giá trị hoàn tiền: <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400 font-black">{(editingRTV.claimValuation || 0).toLocaleString('vi-VN')} ₫</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">PHÂN LOẠI LÝ DO TRẢ *</label>
              <select
                value={editingRTV.reason || 'DEFECTIVE_BATCH'}
                onChange={(e) => setEditingRTV({ ...editingRTV, reason: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
              >
                <option value="DEFECTIVE_BATCH">Lô hàng lỗi chất lượng</option>
                <option value="WRONG_SPECIFICATION">Sai mẫu mã đặt hàng</option>
                <option value="EXPIRED_ON_ARRIVAL">Hết hạn sử dụng khi nhận</option>
                <option value="EXCESS_UNORDERED">Giao dư số lượng hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TRẠNG THÁI XỬ LÝ *</label>
              <select
                value={editingRTV.status || 'PENDING_SUPPLIER_APPROVAL'}
                onChange={(e) => setEditingRTV({ ...editingRTV, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
              >
                <option value="PENDING_SUPPLIER_APPROVAL">Chờ nhà cung cấp phản hồi</option>
                <option value="APPROVED_CREDIT_NOTE">Đã duyệt bồi hoàn</option>
                <option value="REPLACEMENT_DISPATCHED">Đang gửi hàng thay thế</option>
                <option value="REJECTED">Từ chối yêu cầu</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NHÂN VIÊN PHỤ TRÁCH *</label>
              <input
                type="text"
                value={editingRTV.filedBy || 'Người quản lý'}
                onChange={(e) => setEditingRTV({ ...editingRTV, filedBy: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ĐƠN VỊ VẬN CHUYỂN</label>
              <input
                type="text"
                value={editingRTV.logisticsCarrier || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, logisticsCarrier: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Nhà xe nội địa, GHTK, Viettel Post..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">MÃ VẬN ĐƠN TRACKING</label>
              <input
                type="text"
                value={editingRTV.trackingNumber || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, trackingNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Mã vận đơn..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">GHI CHÚ & THỎA THUẬN BỐI HOÀN</label>
            <textarea
              rows={2}
              value={editingRTV.notes || ''}
              onChange={(e) => setEditingRTV({ ...editingRTV, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Nội dung thỏa thuận bồi hoàn với nhà cung cấp..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 border rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow transition-all"
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
