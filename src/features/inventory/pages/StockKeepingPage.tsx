import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, AlertTriangle, Layers, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { toast } from 'sonner';


import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

interface StockKeepingRecord {
  id: string;
  sku: string;
  productName: string;
  unit: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  stockValue: number;
  status: 'DAY_DU' | 'SAP_HET' | 'VUOT_DINH_MUC';
  notes?: string;
}

export function StockKeepingPage() {
  const { products: data, fetchProducts, addProduct, updateProduct, deleteProduct } = useInventoryStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>({});
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d: any) =>
        d.sku.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.category && d.category.toLowerCase().includes(q))
    );

  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      name: '',
      unitName: 'Cái',
      category: 'Chung',
      warehouseName: 'Kho Cửa Hàng Tổng',
      onHand: 0,
      minStock: 5,
      reorderPoint: 10,
      maxStock: 100,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingItem({
      ...item,
      warehouseName: item.warehouseName || 'Kho Cửa Hàng Tổng',
      minStock: item.minStock ?? 5,
      reorderPoint: item.reorderPoint ?? 10,
      maxStock: item.maxStock ?? 100,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.sku || !editingItem.name) return;

    const payload = {
      sku: editingItem.sku,
      name: editingItem.name,
      category: editingItem.category || 'Chung',
      unitName: editingItem.unitName || editingItem.unit || 'Cái',
      warehouseName: editingItem.warehouseName || 'Kho Cửa Hàng Tổng',
      onHand: Number(editingItem.onHand || 0),
      minStock: Number(editingItem.minStock ?? 5),
      reorderPoint: Number(editingItem.reorderPoint ?? 10),
      maxStock: Number(editingItem.maxStock ?? 100),
      status: editingItem.status || 'ACTIVE',
      notes: editingItem.notes || '',
    };

    try {
      if (modalMode === 'create') {
        await addProduct(payload as any);
        toast.success(`Đã khai báo chính sách định mức tồn kho thành công cho SKU ${editingItem.sku}!`);
      } else if (editingItem.id) {
        await updateProduct(editingItem.id, payload as any);
        toast.success(`Đã cập nhật chính sách định mức tồn kho thành công cho SKU ${editingItem.sku}!`);
      }
    } catch (err: any) {
      toast.error('Lỗi khi lưu chính sách định mức tồn kho: ' + (err.message || 'Hệ thống bận'));
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      toast.success(`Đã xóa sản phẩm "${deletingProduct.name}" thành công!`);
      if (selected?.id === deletingProduct.id) setSelected(null);
      setDeletingProduct(null);
    } catch (err: any) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      toast.error('Không thể xóa sản phẩm: ' + (err?.response?.data?.message || err?.message || 'Có ràng buộc dữ liệu tồn kho'));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'onHand',
        header: 'Tồn kho hiện tại',
        cell: (info) => <span className="font-mono font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'unit',
        header: 'Đơn vị tính',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        id: 'stockValue',
        header: 'Giá trị tồn kho',
        cell: ({ row }) => <span className="font-mono text-blue-600 font-bold">{formatCurrency((row.original.price || 0) * (row.original.onHand || 0))}</span>,
      },
      {
        id: 'status',
        header: 'Trạng thái định mức',
        cell: ({ row }) => {
          const onHand = Number(row.original.onHand || 0);
          const minStock = Number(row.original.minStock ?? 5);
          const reorderPoint = Number(row.original.reorderPoint ?? 10);
          const maxStock = Number(row.original.maxStock ?? 100);

          let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
          let label = '🟢 An toàn';

          if (onHand <= minStock) {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200';
            label = '🔴 Dưới định mức';
          } else if (reorderPoint > 0 && onHand <= reorderPoint) {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200';
            label = '🟡 Sắp hết / Cần đặt';
          } else if (maxStock > 0 && onHand > maxStock) {
            badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200';
            label = '🟠 Vượt định mức';
          }
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết tồn kho"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa hạn mức"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingProduct(row.original)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý mức tồn kho (stock keeping)</h1>
          <p className="text-sm text-gray-500">
            Theo dõi lượng tồn kho thực tế của từng sản phẩm SKU, thiết lập cảnh báo dưới hạn định mức tối thiểu/tối đa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Khai Báo Mức SKU Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã SKU, tên sản phẩm, danh mục sản phẩm..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết tồn kho: ${selected?.name}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU:</span>
                <p className="font-mono font-semibold">{selected.sku}</p>
              </div>
              <div>
                <span className="text-gray-500">Đơn vị tính:</span>
                <p>{selected.unit}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên sản phẩm:</span>
              <p className="font-semibold">{selected.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Danh mục:</span>
              <p>{selected.category}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tồn kho hiện tại:</span>
                <p className="font-mono font-bold text-lg">{selected.onHand}</p>
              </div>
              <div>
                <span className="text-gray-500">Định mức min:</span>
                <p className="font-mono text-red-600">{selected.minStock}</p>
              </div>
              <div>
                <span className="text-gray-500">Định mức max:</span>
                <p className="font-mono text-amber-600">{selected.maxStock}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Ước tính giá trị tồn:</span>
              <p className="font-mono font-bold text-blue-600 text-lg">{formatCurrency((selected.price || 0) * (selected.onHand || 0))}</p>
            </div>
            <div>
              <span className="text-gray-500">Cảnh báo định mức:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    (selected.minStock > 0 && selected.onHand <= selected.minStock) ? 'bg-red-100 text-red-800' : (selected.maxStock > 0 && selected.onHand >= selected.maxStock) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {(selected.minStock > 0 && selected.onHand <= selected.minStock) ? 'Cần mua hàng gấp' : (selected.maxStock > 0 && selected.onHand >= selected.maxStock) ? 'Tồn kho vượt hạn mức' : 'Đầy đủ (an toàn)'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú kho:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📋 Khai báo chính sách định mức tồn kho (Stock Policy)' : '⚙️ Điều chỉnh định mức tồn kho'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* Section 1: Sản phẩm & Môi trường kho */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. Thông tin sản phẩm & Phạm vi kho</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã SKU *</label>
                <input
                  type="text"
                  value={editingItem.sku || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = data.find((p: any) => p.sku?.toLowerCase() === val.toLowerCase());
                    if (found) {
                      setEditingItem({
                        ...editingItem,
                        sku: val,
                        name: found.name,
                        unit: found.unit || (found as any).unitName || 'Cái',
                        unitName: found.unit || (found as any).unitName || 'Cái',
                        onHand: found.onHand ?? (found as any).currentStock ?? 0,
                        minStock: found.minStock || editingItem.minStock || 5,
                        maxStock: found.maxStock || editingItem.maxStock || 100,
                      });
                    } else {
                      setEditingItem({ ...editingItem, sku: val });
                    }
                  }}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  placeholder="SKU-XXXX"
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Kho áp dụng *</label>
                <select
                  value={editingItem.warehouseName || 'Kho Cửa Hàng Tổng'}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseName: e.target.value })}
                  className="w-full mt-1 p-2 border rounded text-xs dark:bg-gray-950 dark:border-gray-700"
                >
                  <option value="Kho Cửa Hàng Tổng">Kho Cửa Hàng Tổng</option>
                  <option value="Kho Hà Nội">Kho Hà Nội</option>
                  <option value="Kho TP.HCM">Kho TP.HCM</option>
                  <option value="ALL">Áp dụng cho tất cả kho</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tên sản phẩm * (Từ API sản phẩm)</label>
                <select
                  value={editingItem.name || ''}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const found = data.find((p: any) => p.name === selectedName);
                    if (found) {
                      setEditingItem({
                        ...editingItem,
                        name: found.name,
                        sku: found.sku,
                        unit: found.unit || (found as any).unitName || 'Cái',
                        unitName: found.unit || (found as any).unitName || 'Cái',
                        onHand: found.onHand ?? (found as any).currentStock ?? 0,
                        minStock: found.minStock || editingItem.minStock || 5,
                        maxStock: found.maxStock || editingItem.maxStock || 100,
                      });
                    } else {
                      setEditingItem({ ...editingItem, name: selectedName });
                    }
                  }}
                  className="w-full mt-1 p-2 border rounded text-xs dark:bg-gray-950 dark:border-gray-700 font-semibold"
                  required
                  disabled={modalMode === 'edit'}
                >
                  <option value="">-- Chọn sản phẩm từ API --</option>
                  {data.map((p: any) => (
                    <option key={p.id || p.sku} value={p.name}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Đơn vị tính *</label>
                <input
                  type="text"
                  value={editingItem.unit || editingItem.unitName || 'Cái'}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value, unitName: e.target.value })}
                  className="w-full mt-1 p-2 border rounded text-xs dark:bg-gray-950 dark:border-gray-700"
                  placeholder="Hộp, lon, túi, cái..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tồn kho thực tế (Readonly) */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Tồn kho hiện tại (Tính tự động)</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Số lượng tổng từ các giao dịch kho InventoryBalance</p>
            </div>
            <div className="font-mono text-base font-extrabold text-blue-700 dark:text-blue-300">
              {editingItem.onHand || 0} {editingItem.unit || 'Cái'}
            </div>
          </div>

          {/* Section 3: Định mức tồn kho (Min / Reorder / Max) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Chính sách hạn mức (Stock Policy)</h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Định mức Min *</label>
                <input
                  type="number"
                  value={editingItem.minStock ?? 5}
                  onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  required
                  min={0}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Điểm đặt hàng *</label>
                <input
                  type="number"
                  value={editingItem.reorderPoint ?? 10}
                  onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  required
                  min={0}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Định mức Max *</label>
                <input
                  type="number"
                  value={editingItem.maxStock ?? 100}
                  onChange={(e) => setEditingItem({ ...editingItem, maxStock: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded font-mono text-xs dark:bg-gray-950 dark:border-gray-700"
                  required
                  min={1}
                />
              </div>
            </div>

            <div className="pt-2 border-t dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-500">Gợi ý số lượng đặt thêm:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {Math.max(0, (editingItem.maxStock || 100) - (editingItem.onHand || 0))} {editingItem.unit || 'Cái'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Ghi chú chính sách</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700 text-xs"
              rows={2}
              placeholder="Ghi chú về thời gian nhập hàng, tần suất đặt lại..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm">
              Lưu chính sách định mức
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa sản phẩm"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct?.name}" (SKU: ${deletingProduct?.sku}) khỏi kho?`}
      />
    </div>
  );
}
