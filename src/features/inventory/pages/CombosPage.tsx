import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Package, Tag, Download, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';

import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ProductCombo, type ComboDetailItem } from '../store/inventoryStore';

export function CombosPage() {
  const { combos: data, addCombo, updateCombo, deleteCombo, products, fetchCombos, fetchProducts } = useInventoryStore();

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, [fetchCombos, fetchProducts]);
  
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

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo.comboCode || !editingCombo.comboName) return;

    const payload: Omit<ProductCombo, 'id'> = {
      comboCode: editingCombo.comboCode,
      comboBarcode: editingCombo.comboBarcode || '',
      comboType: editingCombo.comboType || 'PRE_ASSEMBLED',
      comboName: editingCombo.comboName,
      description: editingCombo.description || '',
      comboPrice: Number(editingCombo.comboPrice) || 0,
      status: editingCombo.status || 'ACTIVE',
      validFrom: editingCombo.validFrom || '',
      validUntil: editingCombo.validUntil || '',
      details: editingDetails
    };

    if (modalMode === 'create') {
      addCombo(payload);
    } else if (editingCombo.id) {
      updateCombo(editingCombo.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCombo) return;
    deleteCombo(deletingCombo.id);
    setDeletingCombo(null);
  };

  // Combo Details Logic
  const handleAddDetail = () => {
    if (products.length === 0) {
      alert("Không có sản phẩm nào trong kho để tạo Combo.");
      return;
    }
    const firstProduct = products[0];
    setEditingDetails([...editingDetails, { 
      id: Date.now().toString(), 
      sku: firstProduct.sku, 
      productName: firstProduct.name, 
      quantity: 1, 
      unitPriceAtCreation: firstProduct.price 
    }]);
  };

  const handleDetailSkuChange = (id: string, newSku: string) => {
    const product = products.find(p => p.sku === newSku);
    if (!product) return;
    
    setEditingDetails(editingDetails.map(d => 
      d.id === id ? { ...d, sku: product.sku, productName: product.name, unitPriceAtCreation: product.price } : d
    ));
  };

  const handleDetailQtyChange = (id: string, qty: number) => {
    setEditingDetails(editingDetails.map(d => d.id === id ? { ...d, quantity: qty } : d));
  };

  const handleRemoveDetail = (id: string) => {
    setEditingDetails(editingDetails.filter(d => d.id !== id));
  };

  const calculateOriginalValue = () => {
    return editingDetails.reduce((sum, item) => sum + (item.quantity * item.unitPriceAtCreation), 0);
  };

  const columns = useMemo<ColumnDef<ProductCombo>[]>(
    () => [
      {
        accessorKey: 'comboCode',
        header: 'Mã combo',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'comboBarcode',
        header: 'Mã vạch Combo',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{info.getValue() as string || '—'}</span>,
      },
      {
        accessorKey: 'comboType',
        header: 'Loại combo',
        cell: (info) => {
          const t = info.getValue() as string;
          return (
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t === 'PRE_ASSEMBLED' ? 'Đóng gói sẵn' : 'Gom động (POS)'}
            </span>
          );
        },
      },
      {
        accessorKey: 'comboName',
        header: 'Tên gói',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'comboPrice',
        header: 'Giá gói',
        cell: (info) => <span className="font-bold text-emerald-600">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'details',
        header: 'Thành phần',
        cell: ({ row }) => {
          const count = row.original.details?.length || 0;
          return <span className="text-sm font-semibold">{count} sản phẩm</span>;
        }
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {status === 'ACTIVE' ? 'Đang bán' : 'Tạm ngưng'}
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
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingCombo(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <p className="text-sm text-gray-500 mt-1">Gộp nhiều sản phẩm thành một mã chung để bán với giá ưu đãi.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo Combo Mới
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
                placeholder="Search by combo name or code..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2  border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang bán (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
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
        title={selectedCombo ? `Chi tiết Combo: ${selectedCombo.comboCode}` : 'Chi tiết Combo'}
        width="max-w-lg"
      >
        {selectedCombo && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-900 leading-tight">{selectedCombo.comboName}</h2>
                  <p className="text-xs text-emerald-800 mt-1 uppercase tracking-wider">Mã gói: {selectedCombo.comboCode}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded-xl bg-gray-50 border-gray-200">
                <p className="text-xs font-semibold uppercase text-gray-600">Giá gói (combo price)</p>
                <p className="text-2xl font-bold text-emerald-700">{selectedCombo.comboPrice.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div className="border p-4 rounded-xl bg-gray-50 border-gray-200">
                <p className="text-xs font-semibold uppercase text-gray-600">Tổng giá trị gốc</p>
                <p className="text-2xl font-bold text-gray-900 line-through">
                  {selectedCombo.details.reduce((sum, i) => sum + (i.quantity * i.unitPriceAtCreation), 0).toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-white border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" /> Các sản phẩm trong gói ({selectedCombo.details.length})
                </span>
              </div>
              <div className="p-4 space-y-2">
                {selectedCombo.details.map(d => (
                  <div key={d.id} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{d.productName}</p>
                      <p className="text-xs text-gray-500 font-mono">{d.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{d.quantity} x {d.unitPriceAtCreation.toLocaleString('vi-VN')} ₫</p>
                      <p className="text-xs text-gray-500 font-bold">= {(d.quantity * d.unitPriceAtCreation).toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã vạch quầy (UPC):</span>
                <span className="font-mono font-semibold">{selectedCombo.comboBarcode || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loại combo:</span>
                <span className="font-semibold">
                  {selectedCombo.comboType === 'PRE_ASSEMBLED' ? 'Pre-assembled (trừ tồn khi đóng gói)' : 'Dynamic/Virtual (trừ khi bán POS)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày bắt đầu áp dụng:</span>
                <span className="font-semibold">{selectedCombo.validFrom || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày kết thúc:</span>
                <span className="font-semibold">{selectedCombo.validUntil || 'Không giới hạn'}</span>
              </div>
              {selectedCombo.description && (
                <div className="pt-2  mt-2">
                  <span className="text-gray-500 block mb-1">Mô tả gói:</span>
                  <p className="font-medium">{selectedCombo.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo gói combo mới' : 'Cập nhật combo'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSaveCombo} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-700 uppercase border-b pb-1">Thông tin Gói</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã combo *</label>
                  <input
                    type="text"
                    value={editingCombo.comboCode || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, comboCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã vạch Combo (UPC) *</label>
                  <input
                    type="text"
                    value={editingCombo.comboBarcode || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, comboBarcode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loại combo</label>
                  <select
                    value={editingCombo.comboType || 'PRE_ASSEMBLED'}
                    onChange={(e) => setEditingCombo({ ...editingCombo, comboType: e.target.value as ProductCombo['comboType'] })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PRE_ASSEMBLED">Pre-assembled (đóng gói sẵn)</option>
                    <option value="DYNAMIC_VIRTUAL">Dynamic/Virtual (gom tại quầy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={editingCombo.status || 'ACTIVE'}
                    onChange={(e) => setEditingCombo({ ...editingCombo, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên gói combo *</label>
                <input
                  type="text"
                  value={editingCombo.comboName || ''}
                  onChange={(e) => setEditingCombo({ ...editingCombo, comboName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={editingCombo.validFrom || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={editingCombo.validUntil || ''}
                    onChange={(e) => setEditingCombo({ ...editingCombo, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả gói</label>
                <textarea
                  rows={2}
                  value={editingCombo.description || ''}
                  onChange={(e) => setEditingCombo({ ...editingCombo, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Right Column: Combo Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-700 uppercase border-b pb-1">Thành phần Gói (Sản phẩm)</h3>
              
              <div className="border rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700">Các sản phẩm trong Combo</span>
                  <button type="button" onClick={handleAddDetail} className="text-xs bg-white border px-2 py-1 rounded text-emerald-600 font-semibold hover:bg-gray-100">
                    + Thêm SP
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingDetails.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Chưa có sản phẩm nào. Hãy bấm Thêm SP.</p>}
                  
                  {editingDetails.map((d) => (
                    <div key={d.id} className="bg-white border p-2 rounded relative flex flex-col gap-2 shadow-sm">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold">Chọn Sản phẩm (SKU)</label>
                        <select 
                          value={d.sku}
                          onChange={(e) => handleDetailSkuChange(d.id, e.target.value)}
                          className="w-full p-1 border rounded text-xs"
                        >
                          {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku}) - {p.price.toLocaleString('vi-VN')} ₫</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-20">
                          <label className="block text-[10px] text-gray-500 font-bold">SL (Qty)</label>
                          <input 
                            type="number" min="1" value={d.quantity} 
                            onChange={(e) => handleDetailQtyChange(d.id, parseInt(e.target.value) || 1)}
                            className="w-full p-1 border rounded text-xs text-center font-bold"
                          />
                        </div>
                        <div className="flex-1 text-right flex flex-col justify-end">
                          <span className="text-[10px] text-gray-500">Giá gốc: {d.unitPriceAtCreation.toLocaleString('vi-VN')} ₫</span>
                          <span className="text-xs font-bold text-gray-900">Tổng: {(d.quantity * d.unitPriceAtCreation).toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveDetail(d.id)} className="text-red-500 hover:text-red-700 p-1 mb-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pricing Summary */}
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs text-emerald-800 block">Tổng giá trị gốc: <span className="font-mono line-through">{calculateOriginalValue().toLocaleString('vi-VN')} ₫</span></span>
                  <label className="block text-xs font-bold text-emerald-900 mt-1">GIÁ BÁN COMBO MỚI (₫):</label>
                </div>
                <input
                  type="text"
                  value={(editingCombo.comboPrice ?? 0) === 0 ? '' : Math.round(editingCombo.comboPrice ?? 0).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const val = digits === '' ? 0 : parseInt(digits, 10);
                    setEditingCombo({ ...editingCombo, comboPrice: val });
                  }}
                  className="w-32 px-2 py-1 border border-blue-300 rounded bg-white text-emerald-700 font-bold text-right focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 ">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu combo
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingCombo}
        onClose={() => setDeletingCombo(null)}
        title="Xóa gói sản phẩm"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa combo <strong>{deletingCombo?.comboName}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 ">
            <button type="button" onClick={() => setDeletingCombo(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
