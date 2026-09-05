import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Tag, Layers, Download, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { TreeSelect } from '@/shared/components/ui/TreeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '../store/inventoryStore';
import { toast } from 'sonner';

interface ProductDetailRecord {
  id: string;
  barcode: string;
  productName: string;
  categoryName: string;
  brand: string;
  sellingPrice: number;
  costPrice: number;
  status: 'DANG_KINH_DOANH' | 'NGUNG_KINH_DOANH';
  notes?: string;
  unit?: string;
  reorderPoint?: number;
  safetyStock?: number;
  vatRate?: number;
  weight?: number;
  dimensions?: string;
  warrantyPeriodMonths?: number;
  allowNegativeStock?: boolean;
}

export function ProductDetailsPage() {
  const { products: storeProducts, fetchProducts, addProduct, updateProduct, deleteProduct } = useInventoryStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const data: ProductDetailRecord[] = useMemo(() => {
    return storeProducts.map((p) => ({
      id: p.id,
      barcode: (p.barcodes && p.barcodes[0]) || p.sku,
      productName: p.name,
      categoryName: p.category || 'Mặc định',
      brand: p.brand || 'Chính hãng',
      sellingPrice: p.price || 0,
      costPrice: p.costPrice || 0,
      status: p.status === 'INACTIVE' ? 'NGUNG_KINH_DOANH' : 'DANG_KINH_DOANH',
      notes: (p as any).notes || (p as any).description || '',
      unit: (p as any).unit || 'Cái',
      reorderPoint: Number((p as any).reorderPoint ?? (p as any).minStock ?? 10),
      safetyStock: Number((p as any).safetyStock ?? (p as any).minStock ?? 5),
      vatRate: Number((p as any).vatRate ?? 10),
      weight: Number((p as any).weight ?? 0),
      dimensions: (p as any).dimensions || '',
      warrantyPeriodMonths: Number((p as any).warrantyPeriodMonths ?? 0),
      allowNegativeStock: Boolean((p as any).allowNegativeStock),
    }));
  }, [storeProducts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductDetailRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ProductDetailRecord>>({});
  const [deletingProduct, setDeletingProduct] = useState<ProductDetailRecord | null>(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.barcode.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.categoryName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      barcode: `893${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      productName: '',
      categoryName: 'Chung',
      brand: 'Chính hãng',
      sellingPrice: 0,
      costPrice: 0,
      status: 'DANG_KINH_DOANH',
      notes: '',
      unit: 'Cái',
      reorderPoint: 10,
      safetyStock: 5,
      vatRate: 10,
      weight: 0,
      dimensions: '',
      warrantyPeriodMonths: 12,
      allowNegativeStock: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductDetailRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.barcode || !editingItem.productName) return;

    const barcodeVal = (editingItem.barcode || '').trim();
    const payload: any = {
      sku: barcodeVal,
      productCode: barcodeVal,
      barcode: barcodeVal,
      barcodes: barcodeVal ? [barcodeVal] : [],
      name: editingItem.productName,
      category: editingItem.categoryName || 'Mặc định',
      brand: editingItem.brand || 'Chính hãng',
      price: Number(editingItem.sellingPrice || 0),
      costPrice: Number(editingItem.costPrice || 0),
      status: editingItem.status === 'NGUNG_KINH_DOANH' ? 'INACTIVE' : 'ACTIVE',
      notes: editingItem.notes || '',
      description: editingItem.notes || '',
      unit: editingItem.unit || 'Cái',
      reorderPoint: Number(editingItem.reorderPoint) || 0,
      minStock: Number(editingItem.safetyStock) || 0,
      safetyStock: Number(editingItem.safetyStock) || 0,
      vatRate: Number(editingItem.vatRate) || 0,
      weight: Number(editingItem.weight) || 0,
      dimensions: editingItem.dimensions || '',
      warrantyPeriodMonths: Number(editingItem.warrantyPeriodMonths) || 0,
      allowNegativeStock: Boolean(editingItem.allowNegativeStock),
    };

    if (modalMode === 'create') {
      await addProduct(payload);
      toast.success('Đã thêm sản phẩm mới thành công!');
    } else if (editingItem.id) {
      await updateProduct(editingItem.id, payload);
      toast.success('Đã cập nhật chi tiết sản phẩm thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      toast.success(`Đã xóa sản phẩm "${deletingProduct.productName}" thành công!`);
      setDeletingProduct(null);
    } catch (err: any) {
      console.error('Delete product error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi xóa sản phẩm!');
    }
  };

  const columns = useMemo<ColumnDef<ProductDetailRecord>[]>(
    () => [
      {
        accessorKey: 'barcode',
        header: 'Mã barcode',
        cell: (info) => <span className="font-mono font-semibold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'categoryName',
        header: 'Danh mục',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'brand',
        header: 'Thương hiệu',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sellingPrice',
        header: 'Giá bán',
        cell: (info) => <span className="font-bold text-primary">{((info.getValue() as number) || 0).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
          const label = status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem thông tin chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa chi tiết"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingProduct(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Xóa sản phẩm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết sản phẩm kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tra cứu và cập nhật thông tin chi tiết từng sản phẩm, mã vạch barcode, giá vốn, giá bán và thuộc tính lưu kho
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm mới sản phẩm
          </button>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã barcode, tên sản phẩm, thương hiệu, danh mục..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Modal Xem chi tiết */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Thông tin chi tiết: ${selected.productName}` : 'Hồ sơ sản phẩm kho'}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Mã barcode:</span>
                <p className="font-mono font-bold text-primary">{selected.barcode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Thương hiệu:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.brand}</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Tên sản phẩm:</span>
              <p className="font-bold text-base text-gray-900 dark:text-white">{selected.productName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Danh mục phân loại:</span>
              <p className="font-semibold text-primary">{selected.categoryName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Giá nhập (giá vốn):</span>
                <p className="font-mono text-gray-900 dark:text-white font-bold">{selected.costPrice.toLocaleString('vi-VN')} đ</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Giá bán lẻ:</span>
                <p className="font-mono text-primary font-bold text-base">{selected.sellingPrice.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Đơn vị & Trọng lượng:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.unit} {selected.weight ? `• ${selected.weight}g` : ''}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Kích thước (D x R x C):</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.dimensions || 'Chưa thiết lập'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Bảo hành chính hãng:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.warrantyPeriodMonths ? `${selected.warrantyPeriodMonths} tháng` : 'Không bảo hành'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Xuất âm khi hết hàng:</span>
                <p className={`font-semibold ${selected.allowNegativeStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {selected.allowNegativeStock ? 'Cho phép xuất âm' : 'Chặn khi hết tồn kho'}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Trạng thái kinh doanh:</span>
              <div className="mt-1">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selected.status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {selected.status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const s = selected;
                  setSelected(null);
                  handleOpenEdit(s);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg text-sm transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới sản phẩm' : 'Sửa thông tin sản phẩm'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã vạch / Barcode *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem(prev => ({
                        ...prev,
                        barcode: `893${Math.floor(1000000000 + Math.random() * 9000000000)}`
                      }))
                    }
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Tự sinh mã EAN-13
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.barcode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                placeholder="Mã vạch sản phẩm"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thương hiệu / Hãng SX</label>
              <input
                type="text"
                value={editingItem.brand || ''}
                onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Ví dụ: Vinamilk, Samsung..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên sản phẩm đầy đủ *</label>
              <input
                type="text"
                value={editingItem.productName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên đầy đủ của mặt hàng kinh doanh..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên rút gọn (in bill POS)</label>
              <input
                type="text"
                value={(editingItem as any).shortName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shortName: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên rút gọn in phiếu..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục sản phẩm *</label>
              <input
                type="text"
                value={editingItem.categoryName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Ví dụ: Đồ uống, Bánh kẹo..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị tính (UOM) *</label>
              <select
                value={editingItem.unit || 'Cái'}
                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="Cái">Cái / Chiếc</option>
                <option value="Hộp">Hộp</option>
                <option value="Thùng">Thùng</option>
                <option value="Chai">Chai / Lọ</option>
                <option value="Kg">Kilogram (kg)</option>
                <option value="Gói">Gói</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá vốn mặc định *</label>
              <CurrencyInput
                value={editingItem.costPrice || 0}
                onChange={(val) => setEditingItem({ ...editingItem, costPrice: val })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá bán lẻ đề xuất *</label>
              <CurrencyInput
                value={editingItem.sellingPrice || 0}
                onChange={(val) => setEditingItem({ ...editingItem, sellingPrice: val })}
                placeholder="0"
              />
            </div>
          </div>

          {Number(editingItem.sellingPrice || 0) > 0 && Number(editingItem.costPrice || 0) > 0 && Number(editingItem.sellingPrice) < Number(editingItem.costPrice) && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Cảnh báo: Giá bán lẻ ({Number(editingItem.sellingPrice).toLocaleString('vi-VN')} đ) đang thấp hơn giá vốn ({Number(editingItem.costPrice).toLocaleString('vi-VN')} đ) — Mặt hàng này sẽ bị bán lỗ!</span>
            </div>
          )}

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60">
            <span className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Định mức kho & tồn kho an toàn</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Định mức đặt hàng lại</label>
                <input
                  type="number"
                  value={editingItem.reorderPoint ?? 10}
                  onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tồn kho an toàn tối thiểu</label>
                <input
                  type="number"
                  value={editingItem.safetyStock ?? 5}
                  onChange={(e) => setEditingItem({ ...editingItem, safetyStock: parseInt(e.target.value) || 0 })}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
            <span className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thông số đóng gói & Bảo hành</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trọng lượng (gram)</label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.weight ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                  placeholder="500"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kích thước (DxRxC cm)</label>
                <input
                  type="text"
                  value={editingItem.dimensions ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, dimensions: e.target.value })}
                  placeholder="20x15x10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bảo hành (tháng)</label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.warrantyPeriodMonths ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, warrantyPeriodMonths: parseInt(e.target.value) || 0 })}
                  placeholder="12"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allowNegativeStock"
                checked={Boolean(editingItem.allowNegativeStock)}
                onChange={(e) => setEditingItem({ ...editingItem, allowNegativeStock: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
              />
              <label htmlFor="allowNegativeStock" className="text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                Cho phép bán khi hết tồn kho (Cho phép xuất âm)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thuế suất VAT (%)</label>
              <select
                value={editingItem.vatRate ?? 10}
                onChange={(e) => setEditingItem({ ...editingItem, vatRate: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value={0}>0% (Miễn thuế VAT)</option>
                <option value={5}>5% (Thuế suất ưu đãi)</option>
                <option value={8}>8% (Nghị định giảm VAT)</option>
                <option value={10}>10% (Thuế suất chuẩn)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái kinh doanh *</label>
              <select
                value={editingItem.status || 'DANG_KINH_DOANH'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="DANG_KINH_DOANH">Đang kinh doanh</option>
                <option value="NGUNG_KINH_DOANH">Ngừng kinh doanh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú sản phẩm</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
              rows={2}
              placeholder="Ghi chú thêm về thông số kỹ thuật, lưu ý bảo quản..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa sản phẩm"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct?.productName}" (${deletingProduct?.barcode}) không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}
