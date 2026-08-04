import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, AlertTriangle, Layers, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


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
      onHand: 0,
      minStock: 5,
      maxStock: 100,
      price: 0,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.sku || !editingItem.name) return;

    const payload = {
      sku: editingItem.sku,
      name: editingItem.name,
      category: editingItem.category || 'Chung',
      unitName: editingItem.unitName || 'Cái',
      onHand: Number(editingItem.onHand || 0),
      minStock: Number(editingItem.minStock || 5),
      maxStock: Number(editingItem.maxStock || 100),
      price: Number(editingItem.price || 0),
      costPrice: Number(editingItem.costPrice || 0),
      status: editingItem.status || 'ACTIVE',
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addProduct(payload as any);
    } else if (editingItem.id) {
      await updateProduct(editingItem.id, payload as any);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    if (selected?.id === id) setSelected(null);
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
        header: 'Tồn kho',
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
        header: 'Định mức',
        cell: ({ row }) => {
          const { onHand = 0, minStock = 0, maxStock = 0 } = row.original;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'An toàn';
          if (minStock > 0 && onHand <= minStock) {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Sắp hết hàng';
          } else if (maxStock > 0 && onHand >= maxStock) {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Vượt định mức';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
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
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Xóa"
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
        title={modalMode === 'create' ? 'Khai báo định mức tồn kho' : 'Điều chỉnh định mức'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã SKU *</label>
              <input
                type="text"
                value={editingItem.sku || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SKU-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn vị tính *</label>
              <input
                type="text"
                value={editingItem.unit || ''}
                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Hộp, lon, túi, cái..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              value={editingItem.name || ''}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên đầy đủ của sản phẩm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Danh mục nhóm hàng</label>
              <input
                type="text"
                value={editingItem.category || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Nước giải khát"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tồn kho hiện tại *</label>
              <input
                type="number"
                value={editingItem.onHand || 0}
                onChange={(e) => setEditingItem({ ...editingItem, onHand: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Định mức tối thiểu (min) *</label>
              <input
                type="number"
                value={editingItem.minStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Định mức tối đa (max) *</label>
              <input
                type="number"
                value={editingItem.maxStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxStock: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá bán lẻ (VND)</label>
              <input
                type="number"
                value={editingItem.price || 0}
                onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Chi tiết ghi chú kho..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu SKU
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
