import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, TrendingUp, TrendingDown, Building2, Calendar, FileText, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockLedgerEntry } from '../store/inventoryStore';

export function StockLedgerPage() {
  const { stockLedger: data, addStockLedgerEntry, updateStockLedgerEntry, deleteStockLedgerEntry, products, fetchStockLedger, fetchProducts } = useInventoryStore();

  useEffect(() => {
    fetchStockLedger();
    fetchProducts();
  }, [fetchStockLedger, fetchProducts]);

  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEntry, setEditingEntry] = useState<Partial<StockLedgerEntry>>({});
  const [deletingEntry, setDeletingEntry] = useState<StockLedgerEntry | null>(null);

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.productName.toLowerCase().includes(q) ||
        item.transactionCode.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }

    // 2. Type filter
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleOpenCreate = () => {
    setFormMode('create');
    const firstProduct = products[0];
    setEditingEntry({
      transactionCode: `TRX-${Date.now().toString().slice(-6)}`,
      sku: firstProduct?.sku || '',
      productName: firstProduct?.name || '',
      type: 'STOCK_IN',
      quantityChange: 10,
      unitPrice: firstProduct?.price || 0,
      totalValuation: (firstProduct?.price || 0) * 10,
      runningBalance: (firstProduct?.onHand || 0) + 10,
      location: firstProduct?.location || 'Kho Quận 1',
      loggedBy: 'Nguyễn Minh Châu',
      referenceDoc: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (entry: StockLedgerEntry) => {
    setFormMode('edit');
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry.transactionCode || !editingEntry.sku) return;

    const prod = products.find(p => p.sku === editingEntry.sku);
    const qtyChange = Number(editingEntry.quantityChange) || 0;
    const unitPriceVal = Number(editingEntry.unitPrice) || 0;

    const payload = {
      transactionCode: editingEntry.transactionCode,
      sku: editingEntry.sku,
      productName: prod?.name || editingEntry.productName || '',
      type: editingEntry.type || 'STOCK_IN',
      quantityChange: qtyChange,
      unitPrice: unitPriceVal,
      totalValuation: qtyChange * unitPriceVal,
      runningBalance: Number(editingEntry.runningBalance) || 0,
      timestamp: editingEntry.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 16),
      location: editingEntry.location || '',
      fromLocationId: editingEntry.fromLocationId || '',
      toLocationId: editingEntry.toLocationId || '',
      batchLotRef: editingEntry.batchLotRef || '',
      glPostingId: editingEntry.glPostingId || '',
      loggedBy: editingEntry.loggedBy || 'Hệ thống',
      referenceDoc: editingEntry.referenceDoc || '',
      notes: editingEntry.notes || '',
    };

    if (formMode === 'create') {
      addStockLedgerEntry(payload);
    } else if (editingEntry.id) {
      updateStockLedgerEntry(editingEntry.id, payload);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEntry) return;
    deleteStockLedgerEntry(deletingEntry.id);
    setDeletingEntry(null);
    if (selectedEntry?.id === deletingEntry.id) {
      setSelectedEntry(null);
    }
  };

  const columns = useMemo<ColumnDef<StockLedgerEntry>[]>(
    () => [
      {
        accessorKey: 'transactionCode',
        header: 'Mã giao dịch',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm / SKU',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Loại biến động',
        cell: (info) => {
          const type = info.getValue() as string;
          const typeMap: Record<string, string> = {
            STOCK_IN: 'Nhập kho',
            STOCK_OUT: 'Xuất kho',
            ADJUSTMENT_UP: 'Kiểm kê tăng',
            ADJUSTMENT_DOWN: 'Kiểm kê giảm',
            TRANSFER: 'Chuyển kho',
            CUSTOMER_RETURN: 'Khách trả hàng',
            VENDOR_RETURN: 'Trả nhà cung cấp',
          };
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
              type === 'STOCK_IN' || type === 'ADJUSTMENT_UP' || type === 'CUSTOMER_RETURN'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : type === 'TRANSFER'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {typeMap[type] || type}
            </span>
          );
        },
      },
      {
        id: 'locations',
        header: 'Từ / Đến kho',
        cell: ({ row }) => {
          const e = row.original;
          if (e.type === 'TRANSFER' && e.fromLocationId && e.toLocationId) {
            return (
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {e.fromLocationId} → {e.toLocationId}
              </span>
            );
          }
          return <span className="text-sm">{e.location}</span>;
        },
      },
      {
        accessorKey: 'quantityChange',
        header: 'Biến động (+/-)',
        cell: ({ row }) => {
          const val = row.original.quantityChange;
          return (
            <span className={`font-mono font-bold text-sm ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {val > 0 ? `+${val}` : val}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalValuation',
        header: 'Giá trị biến động',
        cell: ({ row }) => {
          const val = row.original.totalValuation;
          return (
            <span className={`font-mono font-bold text-sm ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : val < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
              {val > 0 ? `+${val.toLocaleString('vi-VN')} ₫` : val < 0 ? `-${Math.abs(val).toLocaleString('vi-VN')} ₫` : '0 ₫'}
            </span>
          );
        },
      },
      {
        accessorKey: 'runningBalance',
        header: 'Tồn sau GD',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'loggedBy',
        header: 'Người thực hiện',
        cell: (info) => <span className="font-medium text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'timestamp',
        header: 'Thời gian',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'notes',
        header: 'Ghi chú',
        cell: (info) => (
          <span className="text-gray-500 text-sm max-w-[200px] truncate block" title={info.getValue() as string}>
            {info.getValue() as string || '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedEntry(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingEntry(row.original); }}
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

  const typeLabels: Record<string, string> = {
    STOCK_IN: 'Nhập kho',
    STOCK_OUT: 'Xuất kho',
    ADJUSTMENT_UP: 'Kiểm kê tăng',
    ADJUSTMENT_DOWN: 'Kiểm kê giảm',
    TRANSFER: 'Chuyển kho',
    CUSTOMER_RETURN: 'Khách trả hàng',
    VENDOR_RETURN: 'Trả nhà cung cấp',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ kho Tổng hợp & Lịch sử Biến động</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sổ kho lưu trữ nhật ký biến động hàng hóa: nhập hàng, xuất kho, chuyển kho và kiểm kê điều chỉnh. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Điều chỉnh tồn kho
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
                placeholder="Tìm kiếm theo SKU, tên sản phẩm, mã giao dịch hoặc vị trí..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Loại biến động:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả biến động</option>
                <option value="STOCK_IN">Nhập kho (STOCK IN)</option>
                <option value="STOCK_OUT">Xuất kho (STOCK OUT)</option>
                <option value="ADJUSTMENT_UP">Kiểm kê tăng (ADJUSTMENT UP)</option>
                <option value="ADJUSTMENT_DOWN">Kiểm kê giảm (ADJUSTMENT DOWN)</option>
                <option value="TRANSFER">Chuyển kho (TRANSFER)</option>
                <option value="CUSTOMER_RETURN">Khách trả hàng (CUSTOMER RETURN)</option>
                <option value="VENDOR_RETURN">Trả nhà cung cấp (VENDOR RETURN)</option>
              </select>
            </div>

            {(typeFilter !== 'all' || search) && (
              <button
                onClick={() => { setTypeFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedEntry(row)} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry ? `Bút toán sổ kho: ${selectedEntry.transactionCode}` : 'Chi tiết giao dịch'}
        width="max-w-lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedEntry.quantityChange > 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedEntry.quantityChange > 0 ? 'bg-emerald-600' : 'bg-red-600'
                }`}>
                  {selectedEntry.quantityChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    selectedEntry.quantityChange > 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'
                  }`}>
                    Giá trị {typeLabels[selectedEntry.type]}
                  </p>
                  <p className={`text-xl font-bold ${
                    selectedEntry.quantityChange > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {selectedEntry.totalValuation > 0 ? `+${selectedEntry.totalValuation.toLocaleString('vi-VN')} ₫` : `-${Math.abs(selectedEntry.totalValuation).toLocaleString('vi-VN')} ₫`}
                  </p>
                </div>
              </div>
              <span className={`font-mono text-lg font-bold px-3 py-1 rounded ${
                selectedEntry.quantityChange > 0
                  ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                  : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedEntry.quantityChange > 0 ? `+${selectedEntry.quantityChange}` : selectedEntry.quantityChange} đơn vị
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Kho bãi
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedEntry.location}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày thực hiện
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedEntry.timestamp}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tên sản phẩm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedEntry.productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã SKU / Barcode:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedEntry.sku}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Giá trị định giá đơn vị:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedEntry.unitPrice.toLocaleString('vi-VN')} ₫ / đơn vị</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tồn kho sau biến động:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedEntry.runningBalance} đơn vị</span>
              </div>
              {selectedEntry.type === 'TRANSFER' && selectedEntry.fromLocationId && selectedEntry.toLocationId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Chuyển kho:</span>
                  <span className="font-mono text-xs font-semibold">{selectedEntry.fromLocationId} → {selectedEntry.toLocationId}</span>
                </div>
              )}
              {selectedEntry.batchLotRef && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Lô / Batch:</span>
                  <span className="font-mono font-semibold">{selectedEntry.batchLotRef}</span>
                </div>
              )}
              {selectedEntry.glPostingId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Bút toán GL:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedEntry.glPostingId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Tài liệu chứng từ tham chiếu:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedEntry.referenceDoc}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Người thực hiện ghi nhận:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedEntry.loggedBy}</span>
              </div>

              {selectedEntry.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú nhật ký sổ kho</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedEntry.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                <FileText className="w-4 h-4" /> Xem chứng từ gốc
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                In phiếu sổ kho
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? 'Tạo Bút Toán Điều Chỉnh Tồn Kho' : 'Chỉnh Sửa Bút Toán Sổ Kho'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mã giao dịch *</label>
              <input
                type="text"
                value={editingEntry.transactionCode || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, transactionCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chọn Sản phẩm (SKU) *</label>
              <select
                value={editingEntry.sku || ''}
                onChange={(e) => {
                  const prod = products.find(p => p.sku === e.target.value);
                  setEditingEntry({
                    ...editingEntry,
                    sku: e.target.value,
                    productName: prod?.name || '',
                    unitPrice: prod?.price || 0,
                    runningBalance: (prod?.onHand || 0) + (Number(editingEntry.quantityChange) || 0)
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Loại biến động *</label>
              <select
                value={editingEntry.type || 'STOCK_IN'}
                onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="STOCK_IN">Nhập kho</option>
                <option value="STOCK_OUT">Xuất kho</option>
                <option value="ADJUSTMENT_UP">Kiểm kê tăng</option>
                <option value="ADJUSTMENT_DOWN">Kiểm kê giảm</option>
                <option value="TRANSFER">Chuyển kho</option>
                <option value="CUSTOMER_RETURN">Khách trả hàng</option>
                <option value="VENDOR_RETURN">Trả nhà cung cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Vị trí kho giao dịch *</label>
              <input
                type="text"
                value={editingEntry.location || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Số lượng biến động *</label>
              <input
                type="number"
                value={editingEntry.quantityChange ?? ''}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 0;
                  setEditingEntry({
                    ...editingEntry,
                    quantityChange: qty,
                    totalValuation: qty * (Number(editingEntry.unitPrice) || 0)
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Giá trị định giá (đ) *</label>
              <input
                type="text"
                value={(editingEntry.unitPrice ?? 0) === 0 ? '' : Math.round(editingEntry.unitPrice ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const val = digits === '' ? 0 : parseInt(digits, 10);
                  setEditingEntry({
                    ...editingEntry,
                    unitPrice: val,
                    totalValuation: val * (Number(editingEntry.quantityChange) || 0)
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tồn sau giao dịch *</label>
              <input
                type="number"
                value={editingEntry.runningBalance ?? ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, runningBalance: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chứng từ gốc tham chiếu *</label>
              <input
                type="text"
                value={editingEntry.referenceDoc || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, referenceDoc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Người thực hiện *</label>
              <input
                type="text"
                value={editingEntry.loggedBy || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, loggedBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          {editingEntry.type === 'TRANSFER' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kho xuất (Chuyển kho)</label>
                <input
                  type="text"
                  value={editingEntry.fromLocationId || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, fromLocationId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Kho nhập (Chuyển kho)</label>
                <input
                  type="text"
                  value={editingEntry.toLocationId || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, toLocationId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Số lô hàng (Batch Ref)</label>
              <input
                type="text"
                value={editingEntry.batchLotRef || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, batchLotRef: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bút toán kế toán GL</label>
              <input
                type="text"
                value={editingEntry.glPostingId || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, glPostingId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ghi chú chi tiết</label>
            <textarea
              rows={2}
              value={editingEntry.notes || ''}
              onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
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
        isOpen={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        title="Xóa Bút Toán Sổ Kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa bút toán <strong>{deletingEntry?.transactionCode}</strong> của sản phẩm {deletingEntry?.productName}? Thao tác này sẽ làm lệch số tồn kho chạy trong lịch sử.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setDeletingEntry(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
