import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Layers, Building2, Calendar, FileText, AlertTriangle, ShieldCheck, ShieldAlert, Edit, Trash2, X, SlidersHorizontal } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ProductBatchRecord } from '../store/inventoryStore';
import { toast } from 'sonner';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';
import { useBranchStore } from '@/features/system/store/branchStore';

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

  const { suppliers, fetchSuppliers } = usePurchaseStore();
  const { branches, fetchBranches } = useBranchStore();

  useEffect(() => {
    fetchProductBatches();
    fetchProducts();
    fetchSuppliers();
    fetchBranches();
  }, [fetchProductBatches, fetchProducts, fetchSuppliers, fetchBranches]);

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ProductBatchRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  type BatchFilterPreset = 'all' | 'expiring_soon' | 'expired' | 'in_stock' | 'quarantined';
  const [filterPreset, setFilterPreset] = useState<BatchFilterPreset>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingBatch, setEditingBatch] = useState<Partial<ProductBatchRecord>>({});
  const [deletingBatch, setDeletingBatch] = useState<ProductBatchRecord | null>(null);
  const [adjustingBatch, setAdjustingBatch] = useState<ProductBatchRecord | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [expiringBatch, setExpiringBatch] = useState<ProductBatchRecord | null>(null);
  const [quarantineTarget, setQuarantineTarget] = useState<{ batch: ProductBatchRecord; newStatus: 'QUARANTINED' | 'RECALLED' } | null>(null);

  const presetCounts = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    let expiringSoonCount = 0;
    let expiredCount = 0;
    let inStockCount = 0;
    let quarantinedCount = 0;

    data.forEach((b) => {
      const exp = b.expiryDate ? new Date(b.expiryDate) : null;
      if (b.qualityStatus === 'EXPIRED' || (exp && exp < now)) {
        expiredCount++;
      } else if (exp && exp >= now && exp <= in30Days) {
        expiringSoonCount++;
      }

      if (Number(b.remainingUnits || 0) > 0) {
        inStockCount++;
      }

      if (b.qualityStatus === 'QUARANTINED') {
        quarantinedCount++;
      }
    });

    return {
      all: data.length,
      expiring_soon: expiringSoonCount,
      expired: expiredCount,
      in_stock: inStockCount,
      quarantined: quarantinedCount,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    return data.filter((item) => {
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
      if (!matchesSearch) return false;

      // 2. Status filter dropdown
      if (statusFilter !== 'all' && item.qualityStatus !== statusFilter) {
        return false;
      }

      // 3. Quick preset pills
      if (filterPreset === 'expiring_soon') {
        if (!item.expiryDate) return false;
        const exp = new Date(item.expiryDate);
        return exp >= now && exp <= in30Days && item.qualityStatus !== 'EXPIRED';
      }
      if (filterPreset === 'expired') {
        return item.qualityStatus === 'EXPIRED' || (item.expiryDate && new Date(item.expiryDate) < now);
      }
      if (filterPreset === 'in_stock') {
        return Number(item.remainingUnits || 0) > 0;
      }
      if (filterPreset === 'quarantined') {
        return item.qualityStatus === 'QUARANTINED';
      }

      return true;
    });
  }, [data, search, statusFilter, filterPreset]);

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
      location: 'Kho tổng',
      qualityStatus: 'PASSED_QA',
      inspector: 'Nhân viên kho',
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
    if (!editingBatch.batchNumber || !editingBatch.sku) return;

    if (modalMode === 'create') {
      const newBatch: Omit<ProductBatchRecord, 'id'> = {
        batchNumber: editingBatch.batchNumber,
        sku: editingBatch.sku,
        productName: editingBatch.productName || 'Sản phẩm mới',
        manufactureDate: editingBatch.manufactureDate || new Date().toISOString().split('T')[0],
        expiryDate: editingBatch.expiryDate || new Date().toISOString().split('T')[0],
        initialUnits: Number(editingBatch.initialUnits) || 0,
        remainingUnits: Number(editingBatch.remainingUnits) || 0,
        unitCost: Number(editingBatch.unitCost) || 0,
        supplierName: editingBatch.supplierName || 'Chưa xác định',
        location: editingBatch.location || 'Kho tổng',
        qualityStatus: editingBatch.qualityStatus as any || 'PASSED_QA',
        inspector: editingBatch.inspector || 'Hệ thống',
        notes: editingBatch.notes || ''
      };
      addProductBatch(newBatch);
      toast.success('Đã đăng ký lô hàng mới thành công!');
    } else if (editingBatch.id) {
      updateProductBatch(editingBatch.id, editingBatch);
      toast.success('Đã cập nhật thông tin lô hàng!');
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingBatch) return;
    deleteProductBatch(deletingBatch.id);
    toast.success(`Đã xóa lô hàng "${deletingBatch.batchNumber}"!`);
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
      toast.success(`Đã điều chỉnh lô hàng ${adjustingBatch.batchNumber}`);
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
      toast.success(`Đã đánh dấu hết hạn lô hàng ${expiringBatch.batchNumber}`);
      setExpiringBatch(null);
      setSelectedBatch(null);
    } catch {
      toast.error('Đánh dấu hết hạn lô hàng thất bại');
    }
  };

  const handleConfirmQuarantine = () => {
    if (!quarantineTarget) return;
    updateProductBatch(quarantineTarget.batch.id, { qualityStatus: quarantineTarget.newStatus });
    toast.warning(`Đã chuyển lô ${quarantineTarget.batch.batchNumber} sang ${quarantineTarget.newStatus === 'QUARANTINED' ? 'CÁCH LY' : 'THU HỒI'} — Tự động chặn bán POS!`);
    setQuarantineTarget(null);
    setSelectedBatch(null);
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
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
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
        header: 'Hạn sử dụng',
        cell: ({ row }) => {
          const exp = row.original.expiryDate;
          const isExpired = row.original.qualityStatus === 'EXPIRED' || (exp && new Date(exp) < new Date());
          return (
            <div>
              <span className={`font-mono text-sm ${isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                {exp || 'N/A'}
              </span>
              {isExpired && (
                <p className="text-[10px] font-semibold text-red-500 mt-0.5">⚠ Đã hết hạn</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'remainingUnits',
        header: 'Tồn kho lô',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.remainingUnits.toLocaleString('vi-VN')} đơn vị</span>
            <span className="ml-1 text-xs text-gray-400">/ {row.original.initialUnits.toLocaleString('vi-VN')} ban đầu</span>
          </div>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-sm">{info.getValue() as string || 'Chưa cập nhật'}</span>,
      },
      {
        accessorKey: 'qualityStatus',
        header: 'Trạng thái kiểm định',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            PASSED_QA: 'Đạt chuẩn kiểm định',
            QUARANTINED: 'Cách ly kiểm dịch',
            EXPIRED: 'Hết hạn sử dụng',
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
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
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
            {row.original.qualityStatus === 'PASSED_QA' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuarantineTarget({ batch: row.original, newStatus: 'QUARANTINED' });
                }}
                title="Cách ly kiểm định (Chặn bán POS)"
                className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors shrink-0"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý lô sản phẩm & hạn sử dụng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi các lô sản phẩm, giám sát chất lượng nhập kho và kiểm soát tồn kho cận hạn</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Đăng ký lô nhập mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Quick preset filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">Lọc nhanh:</span>
            {[
              { id: 'all', label: 'Tất cả lô', count: presetCounts.all, color: 'text-gray-700 dark:text-gray-200' },
              { id: 'expiring_soon', label: 'Cận date (< 30 ngày)', count: presetCounts.expiring_soon, color: 'text-amber-600 dark:text-amber-400' },
              { id: 'expired', label: 'Đã hết hạn', count: presetCounts.expired, color: 'text-red-600 dark:text-red-400' },
              { id: 'in_stock', label: 'Còn tồn kho', count: presetCounts.in_stock, color: 'text-emerald-600 dark:text-emerald-400' },
              { id: 'quarantined', label: 'Cách ly kiểm định', count: presetCounts.quarantined, color: 'text-purple-600 dark:text-purple-400' },
            ].map((tab) => {
              const active = filterPreset === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterPreset(tab.id as BatchFilterPreset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 ' + tab.color
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo số lô, SKU, tên sản phẩm hoặc nhà cung cấp..."
                className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái kiểm định:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PASSED_QA">Đạt chuẩn kiểm định</option>
                <option value="QUARANTINED">Cách ly kiểm dịch</option>
                <option value="EXPIRED">Hết hạn sử dụng</option>
                <option value="RECALLED">Thu hồi</option>
              </select>
            </div>

            {(filterPreset !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setFilterPreset('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedBatch(row)} />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch ? `Hồ sơ lô hàng: ${selectedBatch.batchNumber}` : 'Chi tiết lô hàng'}
        width="max-w-lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider font-mono">
                    {selectedBatch.batchNumber}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedBatch.productName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedBatch.qualityStatus === 'PASSED_QA' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedBatch.qualityStatus === 'QUARANTINED' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedBatch.qualityStatus === 'PASSED_QA' ? 'Đạt chuẩn kiểm định' :
                 selectedBatch.qualityStatus === 'QUARANTINED' ? 'Đang cách ly' :
                 selectedBatch.qualityStatus === 'EXPIRED' ? 'Đã hết hạn' : 'Thu hồi'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-primary" />
                  Hạn sử dụng
                </div>
                <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">
                  {selectedBatch.expiryDate}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  Số lượng khả dụng
                </div>
                <p className="text-xl font-bold text-primary">
                  {selectedBatch.remainingUnits.toLocaleString('vi-VN')} đơn vị
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Mã SKU sản phẩm</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedBatch.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Ngày sản xuất (NSX)</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedBatch.manufactureDate || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Đơn vị ban đầu</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedBatch.initialUnits.toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Nhà cung cấp</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedBatch.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Vị trí lưu kho</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedBatch.location}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Người kiểm định (QA)</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedBatch.inspector}</span>
              </div>
            </div>

            {selectedBatch.notes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Ghi chú & kết quả thử nghiệm</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  {selectedBatch.notes}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedBatch.qualityStatus === 'PASSED_QA' && (
                <>
                  <button
                    onClick={() => {
                      const b = selectedBatch;
                      setSelectedBatch(null);
                      openAdjustModal(b);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Điều chỉnh số lượng
                  </button>
                  <button
                    onClick={() => {
                      const b = selectedBatch;
                      setQuarantineTarget({ batch: b, newStatus: 'QUARANTINED' });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" /> Cách ly kiểm dịch
                  </button>
                  <button
                    onClick={() => setExpiringBatch(selectedBatch)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" /> Đánh dấu hết hạn
                  </button>
                </>
              )}
              {selectedBatch.qualityStatus === 'QUARANTINED' && (
                <button 
                  onClick={() => {
                    updateProductBatch(selectedBatch.id, { qualityStatus: 'PASSED_QA' });
                    toast.success(`Đã giải phóng cách ly cho lô ${selectedBatch.batchNumber}`);
                    setSelectedBatch(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Giải phóng kiểm dịch
                </button>
              )}
              {selectedBatch.qualityStatus === 'EXPIRED' && (
                <button 
                  onClick={() => {
                    deleteProductBatch(selectedBatch.id);
                    toast.success(`Đã xử lý tiêu hủy thành công lô ${selectedBatch.batchNumber}`);
                    setSelectedBatch(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                >
                  <AlertTriangle className="w-4 h-4" /> Tiêu hủy / Xử lý hàng hết hạn
                </button>
              )}
              <button 
                onClick={() => toast.success(`Đang in mã vạch cho lô hàng ${selectedBatch.batchNumber}...`)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <FileText className="w-4 h-4 inline mr-1" /> In mã vạch lô hàng
              </button>
            </div>
          </div>
        )}
      </Modal>

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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn sản phẩm hệ thống *</label>
              <SearchLookupModal
                title="Chọn sản phẩm"
                iconType="package"
                placeholder="Chọn sản phẩm..."
                value={editingBatch.sku}
                options={(useInventoryStore.getState().products || []).map((p) => ({
                  id: p.sku,
                  code: p.sku,
                  name: p.name,
                  subtitle: `Danh mục: ${p.category || (p as any).categoryName || 'Chưa phân loại'}`
                }))}
                onChange={(val, opt) => {
                  setEditingBatch(prev => ({
                    ...prev,
                    sku: val,
                    productName: opt ? opt.name : val,
                  }));
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên sản phẩm đăng ký *</label>
            <input
              type="text"
              value={editingBatch.productName || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              placeholder="Tên sản phẩm tự động điền theo SKU"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sản xuất (NSX)</label>
              <input
                type="date"
                value={editingBatch.manufactureDate || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, manufactureDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn (HSD)</label>
              <input
                type="date"
                value={editingBatch.expiryDate || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng lô ban đầu</label>
              <input
                type="number"
                value={editingBatch.initialUnits || 0}
                onChange={(e) => setEditingBatch({ ...editingBatch, initialUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-primary font-semibold">SL tồn hiện tại</label>
              <input
                type="number"
                value={editingBatch.remainingUnits || 0}
                onChange={(e) => setEditingBatch({ ...editingBatch, remainingUnits: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-primary/30 rounded-lg bg-primary/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn giá vốn lô hàng</label>
              <CurrencyInput
                value={editingBatch.unitCost || 0}
                onChange={(val) => setEditingBatch(prev => ({ ...prev, unitCost: val }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <FileDropzone
              label="Chứng nhận kiểm nghiệm COA/CQ & Giấy phép ATTP đính kèm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp gốc *</label>
              <select
                value={editingBatch.supplierName || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, supplierName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.supplierName}>
                    {s.supplierName} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí lưu kho *</label>
              <select
                value={editingBatch.location || 'Kho tổng'}
                onChange={(e) => setEditingBatch({ ...editingBatch, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="Kho tổng">Kho tổng</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.branchName || b.name}>
                    {b.branchName || b.name} ({b.branchCode || b.code || b.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái kiểm định (QA)</label>
              <select
                value={editingBatch.qualityStatus || 'PASSED_QA'}
                onChange={(e) => setEditingBatch({ ...editingBatch, qualityStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="PASSED_QA">Đạt chuẩn kiểm định</option>
                <option value="QUARANTINED">Cách ly kiểm dịch</option>
                <option value="EXPIRED">Đã hết hạn</option>
                <option value="RECALLED">Thu hồi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm định</label>
              <input
                type="text"
                value={editingBatch.inspector || ''}
                onChange={(e) => setEditingBatch({ ...editingBatch, inspector: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú lô hàng</label>
            <textarea
              rows={2}
              value={editingBatch.notes || ''}
              onChange={(e) => setEditingBatch({ ...editingBatch, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
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
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
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
            Số lượng tồn hiện tại: <strong>{adjustingBatch?.remainingUnits}</strong>
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng sau điều chỉnh *</label>
            <input
              type="number"
              min={0}
              value={adjustQty}
              onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do điều chỉnh *</label>
            <textarea
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary resize-none"
              placeholder="Ví dụ: Hao hụt kiểm kê, hư hỏng trong quá trình bảo quản..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAdjustingBatch(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Hủy bỏ</button>
            <button type="button" onClick={handleAdjustConfirm} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">Xác nhận điều chỉnh</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!expiringBatch}
        onClose={() => setExpiringBatch(null)}
        title="Đánh dấu lô hàng hết hạn"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn đánh dấu lô <strong>{expiringBatch?.batchNumber}</strong> là hết hạn sử dụng?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setExpiringBatch(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Hủy bỏ</button>
            <button type="button" onClick={handleExpireConfirm} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">Xác nhận hết hạn</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!quarantineTarget}
        onClose={() => setQuarantineTarget(null)}
        title="Cảnh báo cách ly / thu hồi lô hàng"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Xác nhận chuyển trạng thái kiểm định!</p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400 leading-relaxed">
                Chuyển lô hàng <strong>{quarantineTarget?.batch.batchNumber}</strong> sang <strong>{quarantineTarget?.newStatus === 'QUARANTINED' ? 'CÁCH LY KIỂM DỊCH' : 'THU HỒI'}</strong> sẽ tự động <span className="font-bold underline">CHẶN BÁN</span> tại quầy POS và đơn bán buôn để bảo đảm an toàn kiểm định.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setQuarantineTarget(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmQuarantine}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
            >
              Xác nhận khóa cách ly
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
