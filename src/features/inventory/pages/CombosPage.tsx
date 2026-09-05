import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Package, Tag, Download, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useInventoryStore, type ProductCombo, type ComboDetailItem } from '../store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';

export function CombosPage() {
  const { combos: data, addCombo, updateCombo, deleteCombo, products, fetchCombos, fetchProducts } = useInventoryStore();
  const { branches, fetchBranches } = useBranchStore();

  useEffect(() => {
    fetchCombos();
    fetchProducts();
    fetchBranches();
  }, [fetchCombos, fetchProducts, fetchBranches]);
  
  const [search, setSearch] = useState('');
  const [selectedCombo, setSelectedCombo] = useState<ProductCombo | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [editingCombo, setEditingCombo] = useState<Partial<ProductCombo>>({ details: [] });
  const [editingDetails, setEditingDetails] = useState<ComboDetailItem[]>([]);

  const [deletingCombo, setDeletingCombo] = useState<ProductCombo | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.comboName.toLowerCase().includes(q) ||
        item.comboCode.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCombo({
      comboCode: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      comboBarcode: `893${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      comboType: 'PRE_ASSEMBLED',
      comboName: '',
      description: '',
      comboPrice: 0,
      status: 'ACTIVE',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      details: []
    });
    setEditingDetails([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (combo: ProductCombo) => {
    setModalMode('edit');
    setEditingCombo(combo);
    setEditingDetails(combo.details || []);
    setIsModalOpen(true);
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo.comboCode?.trim()) {
      toast.error('Vui lòng nhập mã combo (ví dụ: CB-1001)!');
      return;
    }
    if (!editingCombo.comboName?.trim()) {
      toast.error('Vui lòng nhập tên gói combo sản phẩm!');
      return;
    }
    if (editingCombo.validFrom && editingCombo.validUntil) {
      if (editingCombo.validUntil < editingCombo.validFrom) {
        toast.error('Ngày kết thúc combo không được nhỏ hơn ngày bắt đầu!');
        return;
      }
    }
    if (editingDetails.length === 0 || editingDetails.every(d => (d.quantity || 0) <= 0)) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào gói combo với số lượng > 0!');
      return;
    }

    const selectedBranch = branches.find(b => String(b.id) === String((editingCombo as any).branchId));
    const payload: Omit<ProductCombo, 'id'> = {
      comboCode: editingCombo.comboCode.trim(),
      comboBarcode: editingCombo.comboBarcode || '',
      comboType: editingCombo.comboType || 'PRE_ASSEMBLED',
      comboName: editingCombo.comboName.trim(),
      description: editingCombo.description || '',
      comboPrice: Number(editingCombo.comboPrice) || 0,
      status: editingCombo.status as ProductCombo['status'] || 'ACTIVE',
      validFrom: editingCombo.validFrom,
      validUntil: editingCombo.validUntil,
      branchId: (editingCombo as any).branchId ? String((editingCombo as any).branchId) : undefined,
      branchName: selectedBranch ? selectedBranch.name : undefined,
      details: editingDetails,
    };

    try {
      if (modalMode === 'create') {
        await addCombo(payload);
        toast.success('Đã tạo gói combo mới thành công!');
      } else if (editingCombo.id) {
        await updateCombo(editingCombo.id, payload);
        toast.success('Đã cập nhật gói combo thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu combo:', err);
      toast.error('Không thể lưu gói combo: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingCombo) {
      try {
        await deleteCombo(deletingCombo.id);
        toast.success(`Đã xóa gói combo "${deletingCombo.comboName}" thành công!`);
        if (selectedCombo?.id === deletingCombo.id) {
          setSelectedCombo(null);
        }
      } catch (err: any) {
        console.error('Lỗi khi xóa combo:', err);
        toast.error('Không thể xóa combo: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
      }
      setDeletingCombo(null);
    }
  };

  const handleAddDetail = () => {
    if (products.length === 0) {
      toast.error('Chưa có danh sách sản phẩm. Không thể thêm thành phần!');
      return;
    }
    const firstProduct = products[0];
    const newDetail: ComboDetailItem = {
      id: `cbd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: firstProduct.id,
      sku: firstProduct.sku,
      productName: firstProduct.name,
      quantity: 1,
      unitPriceAtCreation: firstProduct.price || 0,
    };
    setEditingDetails([...editingDetails, newDetail]);
  };

  const handleDetailSkuChange = (detailId: string, sku: string) => {
    const selectedProd = products.find(p => p.sku === sku);
    if (!selectedProd) return;

    setEditingDetails(prev => prev.map(d => {
      if (d.id === detailId) {
        return {
          ...d,
          productId: selectedProd.id,
          sku: selectedProd.sku,
          productName: selectedProd.name,
          unitPriceAtCreation: selectedProd.price || 0,
        };
      }
      return d;
    }));
  };

  const handleDetailQtyChange = (detailId: string, quantity: number) => {
    setEditingDetails(prev => prev.map(d => {
      if (d.id === detailId) {
        return { ...d, quantity: Math.max(1, quantity) };
      }
      return d;
    }));
  };

  const handleRemoveDetail = (detailId: string) => {
    setEditingDetails(prev => prev.filter(d => d.id !== detailId));
  };

  const calculateOriginalValue = () => {
    return editingDetails.reduce((sum, item) => sum + (item.quantity * item.unitPriceAtCreation), 0);
  };

  const columns = useMemo<ColumnDef<ProductCombo>[]>(
    () => [
      {
        accessorKey: 'comboCode',
        header: 'Mã combo',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'comboName',
        header: 'Tên gói combo',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'comboType',
        header: 'Loại combo',
        cell: (info) => {
          const type = info.getValue() as string;
          return (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {type === 'PRE_ASSEMBLED' ? 'Đóng gói sẵn' : 'Gom tại quầy'}
            </span>
          );
        },
      },
      {
        accessorKey: 'branchName',
        header: 'Chi nhánh áp dụng',
        cell: (info) => {
          const val = info.getValue() as string;
          return <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{val || 'Toàn hệ thống'}</span>;
        },
      },
      {
        accessorKey: 'details',
        header: 'Thành phần',
        cell: (info) => {
          const items = (info.getValue() as ComboDetailItem[]) || [];
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <Package className="w-3 h-3 text-primary" /> {items.length} món
            </span>
          );
        },
      },
      {
        accessorKey: 'comboPrice',
        header: 'Giá bán combo',
        cell: (info) => (
          <span className="font-bold text-primary">
            {((info.getValue() as number) || 0).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {status === 'ACTIVE' ? 'Đang kinh doanh' : 'Tạm ngừng'}
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
              onClick={(e) => { e.stopPropagation(); setSelectedCombo(row.original); }}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingCombo(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Xóa"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý gói sản phẩm (combos)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gộp nhiều sản phẩm thành một mã chung để bán với giá ưu đãi</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> Thêm mới combo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã combo..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái combo:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang kinh doanh</option>
                <option value="INACTIVE">Tạm ngừng</option>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedCombo(row)} />
      </div>

      <Modal
        isOpen={!!selectedCombo}
        onClose={() => setSelectedCombo(null)}
        title={selectedCombo ? `Chi tiết combo: ${selectedCombo.comboCode}` : 'Chi tiết combo'}
        width="max-w-lg"
      >
        {selectedCombo && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{selectedCombo.comboName}</h2>
                  <p className="text-xs text-primary font-mono mt-1 font-semibold uppercase tracking-wider">Mã gói: {selectedCombo.comboCode}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Giá gói combo</p>
                <p className="text-2xl font-bold text-primary">{selectedCombo.comboPrice.toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="border p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Tổng giá trị gốc</p>
                <p className="text-2xl font-bold text-gray-500 line-through">
                  {(selectedCombo.details || []).reduce((sum, i) => sum + (i.quantity * i.unitPriceAtCreation), 0).toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Các sản phẩm trong gói ({(selectedCombo.details || []).length})
                </span>
              </div>
              <div className="p-4 space-y-2">
                {(selectedCombo.details || []).map(d => (
                  <div key={d.id} className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{d.productName}</p>
                      <p className="text-xs text-gray-500 font-mono">{d.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{d.quantity} x {d.unitPriceAtCreation.toLocaleString('vi-VN')} đ</p>
                      <p className="text-xs text-primary font-bold">= {(d.quantity * d.unitPriceAtCreation).toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Mã vạch (UPC / barcode):</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedCombo.comboBarcode || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Chi nhánh áp dụng:</span>
                <span className="font-semibold text-primary">
                  {selectedCombo.branchName || (selectedCombo.branchId ? `Chi nhánh ${selectedCombo.branchId}` : 'Toàn hệ thống')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Loại combo:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedCombo.comboType === 'PRE_ASSEMBLED' ? 'Đóng gói sẵn (trừ tồn khi đóng gói)' : 'Gom tại quầy (trừ tồn khi bán qua POS)'}
                </span>
              </div>
              {selectedCombo.validFrom && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Thời gian hiệu lực:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedCombo.validFrom} {selectedCombo.validUntil ? `đến ${selectedCombo.validUntil}` : '(vô thời hạn)'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedCombo(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = selectedCombo;
                  setSelectedCombo(null);
                  handleOpenEdit(cb);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo mới gói combo sản phẩm' : 'Chỉnh sửa gói combo'}
        size="erp"
      >
        <form onSubmit={handleSaveCombo} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột trái: Thông tin gói & Hiệu lực */}
            <div className="space-y-4">
              <div className="erp-form-section p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> 1. Thông tin chung gói combo
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã combo *</label>
                    <input
                      type="text"
                      value={editingCombo.comboCode || ''}
                      onChange={(e) => setEditingCombo({ ...editingCombo, comboCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 font-mono text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                      placeholder="CB-1001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã vạch (UPC) *</label>
                    <input
                      type="text"
                      value={editingCombo.comboBarcode || ''}
                      onChange={(e) => setEditingCombo({ ...editingCombo, comboBarcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 font-mono text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                      placeholder="893000..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên gói combo *</label>
                  <input
                    type="text"
                    value={editingCombo.comboName || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, comboName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    placeholder="Ví dụ: Combo sữa tươi tiết kiệm (4 hộp)"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại combo</label>
                    <select
                      value={editingCombo.comboType || 'PRE_ASSEMBLED'}
                      onChange={(e) => setEditingCombo({ ...editingCombo, comboType: e.target.value as ProductCombo['comboType'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    >
                      <option value="PRE_ASSEMBLED">Đóng gói sẵn</option>
                      <option value="DYNAMIC_VIRTUAL">Gom tại quầy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                    <select
                      value={editingCombo.status || 'ACTIVE'}
                      onChange={(e) => setEditingCombo({ ...editingCombo, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    >
                      <option value="ACTIVE">Đang kinh doanh</option>
                      <option value="INACTIVE">Tạm ngừng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh áp dụng</label>
                  <select
                    value={(editingCombo as any).branchId || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, branchId: e.target.value } as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  >
                    <option value="">Toàn hệ thống (tất cả chi nhánh)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name || (b as any).branchName || `Chi nhánh ${b.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={editingCombo.validFrom || ''}
                      onChange={(e) => setEditingCombo({ ...editingCombo, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={editingCombo.validUntil || ''}
                      onChange={(e) => setEditingCombo({ ...editingCombo, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả gói</label>
                  <textarea
                    rows={2}
                    value={editingCombo.description || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white resize-none"
                    placeholder="Ghi chú chi tiết về gói khuyến mãi / combo..."
                  />
                </div>
              </div>
            </div>

            {/* Cột phải: Thành phần gói & Định giá */}
            <div className="space-y-4">
              <div className="erp-form-section p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-1.5">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4" /> 2. Thành phần sản phẩm ({editingDetails.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    className="text-xs bg-primary hover:bg-primary-hover text-white px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {editingDetails.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-6">
                      Chưa có sản phẩm nào. Hãy bấm <strong>+ Thêm sản phẩm</strong> để cấu hình thành phần gói.
                    </p>
                  )}
                  
                  {editingDetails.map((d) => (
                    <div key={d.id} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                      <div>
                        <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Chọn sản phẩm</label>
                        <select 
                          value={d.sku}
                          onChange={(e) => handleDetailSkuChange(d.id, e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.sku}>
                              {p.name} ({p.sku}) - {p.price.toLocaleString('vi-VN')} đ
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-24">
                          <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Số lượng</label>
                          <input 
                            type="number" min="1" value={d.quantity} 
                            onChange={(e) => handleDetailQtyChange(d.id, parseInt(e.target.value) || 1)}
                            className="w-full p-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-center font-bold text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex-1 text-right flex flex-col justify-end">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">Đơn giá: {d.unitPriceAtCreation.toLocaleString('vi-VN')} đ</span>
                          <span className="text-xs font-bold text-primary">Thành tiền: {(d.quantity * d.unitPriceAtCreation).toLocaleString('vi-VN')} đ</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail(d.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Xóa sản phẩm khỏi combo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl flex justify-between items-center mt-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Tổng giá niêm yết: <span className="font-mono line-through text-gray-700 dark:text-gray-300 font-semibold">{calculateOriginalValue().toLocaleString('vi-VN')} đ</span>
                    </span>
                    <label className="block text-xs font-bold text-primary mt-0.5 uppercase">
                      Giá bán combo (đ) *
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(editingCombo.comboPrice ?? 0) === 0 ? '' : Math.round(editingCombo.comboPrice ?? 0).toLocaleString('vi-VN')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      const val = digits === '' ? 0 : parseInt(digits, 10);
                      setEditingCombo({ ...editingCombo, comboPrice: val });
                    }}
                    placeholder="0"
                    className="w-36 px-3 py-1.5 border border-primary/30 rounded-lg bg-white dark:bg-gray-900 text-primary font-bold text-right focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="erp-form-footer flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingCombo}
        onClose={() => setDeletingCombo(null)}
        title="Xác nhận xóa gói combo"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa gói combo <strong className="text-gray-900 dark:text-white">{deletingCombo?.comboName}</strong> ({deletingCombo?.comboCode}) không?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingCombo(null)}
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
