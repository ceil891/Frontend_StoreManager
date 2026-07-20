import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Layers, Building2, Calendar, FileText, AlertTriangle, ShieldCheck, Edit, Trash2, X, SlidersHorizontal } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ProductBatchRecord } from '../store/inventoryStore';
import { toast } from 'sonner';

export function ProductBatchesPage() {
  const {
    productBatches: data,
    addProductBatch,
    updateProductBatch,
    deleteProductBatch,
    adjustProductBatch,
    expireProductBatch,
    fetchProductBatches,
    fetchProducts,
  } = useInventoryStore();

  useEffect(() => {
    fetchProductBatches();
    fetchProducts();
  }, [fetchProductBatches, fetchProducts]);

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ProductBatchRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBatch, setEditingBatch] = useState<Partial<ProductBatchRecord>>({});
  const [deletingBatch, setDeletingBatch] = useState<ProductBatchRecord | null>(null);
  const [adjustingBatch, setAdjustingBatch] = useState<ProductBatchRecord | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [expiringBatch, setExpiringBatch] = useState<ProductBatchRecord | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.productName.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.qualityStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setEditingBatch({
      batchNumber: `BTC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}A`,
      sku: '',
      productName: '',
      manufactureDate: today,
      expiryDate: nextYear.toISOString().split('T')[0],
      initialUnits: 100,
      remainingUnits: 100,
      unitCost: 0,
      supplierName: '',
      location: 'Central Warehouse',
      qualityStatus: 'PASSED_QA',
      inspector: 'Warehouse Staff',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: ProductBatchRecord) => {
    setModalMode('edit');
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch.batchNumber || !editingBatch.sku || !editingBatch.productName) return;

    if (modalMode === 'create') {
      const newBatch: Omit<ProductBatchRecord, 'id'> = {
        batchNumber: editingBatch.batchNumber,
        sku: editingBatch.sku,
        productName: editingBatch.productName,
        manufactureDate: editingBatch.manufactureDate || '',
        expiryDate: editingBatch.expiryDate || '',
        initialUnits: Number(editingBatch.initialUnits) || 100,
        remainingUnits: Number(editingBatch.remainingUnits) || 100,
        unitCost: Number(editingBatch.unitCost) || 0,
        supplierName: editingBatch.supplierName || 'Unknown',
        location: editingBatch.location || 'Central Warehouse',
        qualityStatus: editingBatch.qualityStatus as any || 'PASSED_QA',
        inspector: editingBatch.inspector || 'System',
        notes: editingBatch.notes || ''
      };
      addProductBatch(newBatch);
    } else if (editingBatch.id) {
      updateProductBatch(editingBatch.id, editingBatch);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingBatch) return;
    deleteProductBatch(deletingBatch.id);
    setDeletingBatch(null);
  };

  const handleAdjustConfirm = async () => {
    if (!adjustingBatch) return;
    if (!adjustReason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh');
      return;
    }
    try {
      await adjustProductBatch(adjustingBatch.id, adjustQty, adjustReason.trim());
      toast.success(`Đã điều chỉnh lô ${adjustingBatch.batchNumber}`);
      setAdjustingBatch(null);
      setAdjustReason('');
      setSelectedBatch(null);
    } catch {
      toast.error('Điều chỉnh lô hàng thất bại');
    }
  };

  const handleExpireConfirm = async () => {
    if (!expiringBatch) return;
    try {
      await expireProductBatch(expiringBatch.id);
      toast.success(`Đã đánh dấu hết hạn lô ${expiringBatch.batchNumber}`);
      setExpiringBatch(null);
      setSelectedBatch(null);
    } catch {
      toast.error('Đánh dấu hết hạn lô thất bại');
    }
  };

  const openAdjustModal = (batch: ProductBatchRecord) => {
    setAdjustingBatch(batch);
    setAdjustQty(batch.remainingUnits);
    setAdjustReason('');
  };

  const columns = useMemo<ColumnDef<ProductBatchRecord>[]>(
    () => [
      {
        accessorKey: 'batchNumber',
        header: 'Số lô',
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
        accessorKey: 'expiryDate',
        header: 'Ngày hết hạn',
        cell: ({ row }) => {
          const exp = row.original.expiryDate;
          const isExpired = row.original.qualityStatus === 'EXPIRED';
          return (
            <span className={`font-mono text-sm ${isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500'}`}>
              {exp}
            </span>
          );
        },
      },
      {
        accessorKey: 'remainingUnits',
        header: 'Tồn kho lô',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.remainingUnits} đơn vị</span>
            <span className="ml-1 text-xs text-gray-400">/ {row.original.initialUnits} ban đầu</span>
          </div>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
      },
      {
        accessorKey: 'qualityStatus',
        header: 'Trạng thái QA',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            PASSED_QA: 'Đạt chuẩn QA',
            QUARANTINED: 'Cách ly kiểm dịch',
            EXPIRED: 'Hết hạn',
            RECALLED: 'Thu hồi',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'PASSED_QA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'QUARANTINED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedBatch(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); openAdjustModal(row.original); }}
              title="Điều chỉnh số lượng"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {row.original.qualityStatus !== 'EXPIRED' && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpiringBatch(row.original); }}
                title="Đánh dấu hết hạn"
                className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors shrink-0"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingBatch(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Lô Sản phẩm & Hạn sử dụng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi các lô sản phẩm dễ hỏng, giám sát chất lượng nhập kho và phòng ngừa tồn kho hết hạn. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Đăng ký lô nhập
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
                placeholder="Tìm kiếm theo số lô, tên sản phẩm, SKU hoặc nhà cung cấp..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái chất lượng:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PASSED_QA">Đạt chất lượng (PASSED QA)</option>
                <option value="QUARANTINED">Cách ly kiểm dịch (QUARANTINED)</option>
                <option value="EXPIRED">Hết hạn (EXPIRED)</option>
                <option value="RECALLED">Thu hồi (RECALLED)</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedBatch(row)} />
      </div>

      <Drawer
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch ? `Batch Specification: ${selectedBatch.batchNumber}` : 'Batch Details'}
        width="max-w-lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedBatch.qualityStatus === 'PASSED_QA'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedBatch.qualityStatus === 'QUARANTINED'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedBatch.qualityStatus === 'PASSED_QA' ? 'bg-emerald-600' : selectedBatch.qualityStatus === 'QUARANTINED' ? 'bg-amber-600' : 'bg-red-600'
                }`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    selectedBatch.qualityStatus === 'PASSED_QA' ? 'text-emerald-800 dark:text-emerald-400' : selectedBatch.qualityStatus === 'QUARANTINED' ? 'text-amber-800 dark:text-amber-400' : 'text-red-800 dark:text-red-400'
                  }`}>
                    Remaining Batch Valuation
                  </p>
                  <p className={`text-xl font-bold ${
                    selectedBatch.qualityStatus === 'PASSED_QA' ? 'text-emerald-700 dark:text-emerald-400' : selectedBatch.qualityStatus === 'QUARANTINED' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    ${(selectedBatch.remainingUnits * selectedBatch.unitCost).toFixed(2)}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedBatch.qualityStatus === 'PASSED_QA' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedBatch.qualityStatus === 'QUARANTINED' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedBatch.qualityStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Storage Location
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedBatch.location}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-red-500" /> Expiry Cutoff
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedBatch.expiryDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Target Product Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedBatch.productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">SKU Barcode Anchor:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedBatch.sku}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Manufacture Date:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedBatch.manufactureDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Unit Cost Valuation:</span>
                <span className="font-semibold text-gray-900 dark:text-white">${selectedBatch.unitCost.toFixed(2)} / unit</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Remaining vs Initial Stock:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedBatch.remainingUnits} / {selectedBatch.initialUnits} units
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Origin Supplier Vendor:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedBatch.supplierName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">QA Certified Inspector:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedBatch.inspector}</span>
              </div>

              {selectedBatch.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Intake Verification Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedBatch.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3">
              {selectedBatch.qualityStatus !== 'EXPIRED' && (
                <>
                  <button
                    onClick={() => openAdjustModal(selectedBatch)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow transition-colors text-sm min-w-[160px]"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Điều chỉnh SL
                  </button>
                  <button
                    onClick={() => setExpiringBatch(selectedBatch)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" /> Đánh dấu hết hạn
                  </button>
                </>
              )}
              {selectedBatch.qualityStatus === 'QUARANTINED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <ShieldCheck className="w-4 h-4" /> Release From Quarantine
                </button>
              )}
              {selectedBatch.qualityStatus === 'EXPIRED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <AlertTriangle className="w-4 h-4" /> Execute Stock Disposal
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> Print Batch Barcode
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Đăng ký lô sản phẩm mới' : 'Cập nhật lô sản phẩm'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lô (Batch Number) *</label>
              <input
                type="text"
                value={editingBatch.batchNumber || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã SKU Sản phẩm *</label>
              <input
                type="text"
                value={editingBatch.sku || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              value={editingBatch.productName || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sản xuất</label>
              <input
                type="date"
                value={editingBatch.manufactureDate || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, manufactureDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn (Expiry)</label>
              <input
                type="date"
                value={editingBatch.expiryDate || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng ban đầu</label>
              <input
                type="number"
                value={editingBatch.initialUnits || 0}
                onChange={(e) => setEditingBatch({ ...editingBatch, initialUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-emerald-600">SL Tồn hiện tại</label>
              <input
                type="number"
                value={editingBatch.remainingUnits || 0}
                onChange={(e) => setEditingBatch({ ...editingBatch, remainingUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn giá vốn ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingBatch.unitCost || 0}
                onChange={(e) => setEditingBatch({ ...editingBatch, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp gốc</label>
              <input
                type="text"
                value={editingBatch.supplierName || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, supplierName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí lưu kho</label>
              <input
                type="text"
                value={editingBatch.location || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái chất lượng (QA)</label>
              <select
                value={editingBatch.qualityStatus || 'PASSED_QA'}
                onChange={(e) => setEditingBatch({ ...editingBatch, qualityStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PASSED_QA">Đạt chuẩn (Passed QA)</option>
                <option value="QUARANTINED">Cách ly kiểm dịch</option>
                <option value="EXPIRED">Đã hết hạn (Expired)</option>
                <option value="RECALLED">Thu hồi (Recalled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm định</label>
              <input
                type="text"
                value={editingBatch.inspector || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, inspector: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú lô hàng</label>
            <textarea
              rows={2}
              value={editingBatch.notes || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, notes: e.target.value })}
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
              {modalMode === 'create' ? 'Đăng ký lô' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingBatch}
        onClose={() => setDeletingBatch(null)}
        title="Xác nhận xóa lô hàng"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa lô <strong className="text-gray-900 dark:text-white">{deletingBatch?.batchNumber}</strong> không? Cảnh báo: Việc này có thể gây sai lệch tồn kho trên hệ thống.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingBatch(null)}
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

      <Modal
        isOpen={!!adjustingBatch}
        onClose={() => setAdjustingBatch(null)}
        title={`Điều chỉnh lô: ${adjustingBatch?.batchNumber || ''}`}
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Gọi API <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">POST /batches/:id/adjust</code>. SL hiện tại: <strong>{adjustingBatch?.remainingUnits}</strong>
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng sau điều chỉnh *</label>
            <input
              type="number"
              min={0}
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do *</label>
            <textarea
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 resize-none"
              placeholder="Ví dụ: Hao hụt kiểm kê, hàng hỏng..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAdjustingBatch(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleAdjustConfirm} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold">Xác nhận</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!expiringBatch}
        onClose={() => setExpiringBatch(null)}
        title="Đánh dấu lô hết hạn"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Đánh dấu lô <strong>{expiringBatch?.batchNumber}</strong> hết hạn qua API <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">POST /batches/:id/expire</code>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setExpiringBatch(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleExpireConfirm} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold">Xác nhận hết hạn</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
