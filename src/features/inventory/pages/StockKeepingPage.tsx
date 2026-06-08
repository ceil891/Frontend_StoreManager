import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, AlertTriangle, Layers, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

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

const MOCK_STOCK: StockKeepingRecord[] = [
  {
    id: '1',
    sku: 'SKU-MILK-01',
    productName: 'Sữa Tươi Tiệt Trùng Vinamilk 1L',
    unit: 'Hộp',
    categoryName: 'Sữa & Sản phẩm từ sữa',
    currentStock: 120,
    minStock: 20,
    maxStock: 200,
    stockValue: 3600000,
    status: 'DAY_DU',
    notes: 'Hàng bán chạy, hạn sử dụng dài hạn',
  },
  {
    id: '2',
    sku: 'SKU-COKE-02',
    productName: 'Nước Ngọt Coca Cola Lon 320ml',
    unit: 'Lon',
    categoryName: 'Nước giải khát',
    currentStock: 8,
    minStock: 50,
    maxStock: 500,
    stockValue: 80000,
    status: 'SAP_HET',
    notes: 'Cần gửi yêu cầu mua hàng bổ sung gấp',
  },
  {
    id: '3',
    sku: 'SKU-RICE-03',
    productName: 'Gạo Tám Thơm Điện Biên 5kg',
    unit: 'Túi',
    categoryName: 'Lương thực',
    currentStock: 450,
    minStock: 50,
    maxStock: 300,
    stockValue: 67500000,
    status: 'VUOT_DINH_MUC',
    notes: 'Hàng tồn kho vượt định mức tối đa, dừng nhập thêm đợt mới',
  },
];

export function StockKeepingPage() {
  const [data, setData] = useState<StockKeepingRecord[]>(MOCK_STOCK);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockKeepingRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<StockKeepingRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.sku.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.categoryName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      sku: '',
      productName: '',
      unit: '',
      categoryName: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      stockValue: 0,
      status: 'DAY_DU',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StockKeepingRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.sku || !editingItem.productName) return;

    if (modalMode === 'create') {
      const newItem: StockKeepingRecord = {
        id: String(data.length + 1),
        sku: editingItem.sku.toUpperCase(),
        productName: editingItem.productName!,
        unit: editingItem.unit || 'Cái',
        categoryName: editingItem.categoryName || 'Mặc định',
        currentStock: Number(editingItem.currentStock || 0),
        minStock: Number(editingItem.minStock || 0),
        maxStock: Number(editingItem.maxStock || 0),
        stockValue: Number(editingItem.stockValue || 0),
        status: editingItem.status as any || 'DAY_DU',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as StockKeepingRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dòng tồn kho SKU này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<StockKeepingRecord>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên Sản Phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentStock',
        header: 'Tồn Kho',
        cell: (info) => <span className="font-mono font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'unit',
        header: 'Đơn Vị Tính',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'stockValue',
        header: 'Giá Trị Tồn Kho',
        cell: (info) => <span className="font-mono text-blue-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Định Mức',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'An Toàn';
          if (status === 'SAP_HET') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Sắp Hết Hàng';
          } else if (status === 'VUOT_DINH_MUC') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Vượt Định Mức';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem Chi Tiết Tồn Kho"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa Hạn Mức"
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
          <h1 className="text-2xl font-bold">Quản Lý Mức Tồn Kho (Stock Keeping)</h1>
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

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết tồn kho: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU:</span>
                <p className="font-mono font-semibold">{selected.sku}</p>
              </div>
              <div>
                <span className="text-gray-500">Đơn Vị Tính:</span>
                <p>{selected.unit}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm:</span>
              <p className="font-semibold">{selected.productName}</p>
            </div>
            <div>
              <span className="text-gray-500">Danh Mục:</span>
              <p>{selected.categoryName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tồn Kho Hiện Tại:</span>
                <p className="font-mono font-bold text-lg">{selected.currentStock}</p>
              </div>
              <div>
                <span className="text-gray-500">Định Mức Min:</span>
                <p className="font-mono text-red-600">{selected.minStock}</p>
              </div>
              <div>
                <span className="text-gray-500">Định Mức Max:</span>
                <p className="font-mono text-amber-600">{selected.maxStock}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Ước Tính Giá Trị Tồn:</span>
              <p className="font-mono font-bold text-blue-600 text-lg">{formatCurrency(selected.stockValue)}</p>
            </div>
            <div>
              <span className="text-gray-500">Cảnh Báo Định Mức:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DAY_DU'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'SAP_HET'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status === 'DAY_DU'
                    ? 'Đầy Đủ (An Toàn)'
                    : selected.status === 'SAP_HET'
                    ? 'Cần Mua Hàng Gấp'
                    : 'Tồn Kho Vượt Hạn Mức'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Kho:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai Báo Định Mức Tồn Kho' : 'Điều Chỉnh Định Mức'}
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
              <label className="block text-xs text-gray-500 mb-1">Đơn Vị Tính *</label>
              <input
                type="text"
                value={editingItem.unit || ''}
                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Hộp, Lon, Túi, Cái..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Sản Phẩm *</label>
            <input
              type="text"
              value={editingItem.productName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên đầy đủ của sản phẩm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Danh Mục Nhóm Hàng</label>
              <input
                type="text"
                value={editingItem.categoryName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Nước giải khát"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tồn Kho Hiện Tại *</label>
              <input
                type="number"
                value={editingItem.currentStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Định Mức Tối Thiểu (Min) *</label>
              <input
                type="number"
                value={editingItem.minStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Định Mức Tối Đa (Max) *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Ước Tính Giá Trị Tồn (VND)</label>
              <input
                type="number"
                value={editingItem.stockValue || 0}
                onChange={(e) => setEditingItem({ ...editingItem, stockValue: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái Định Mức</label>
              <select
                value={editingItem.status || 'DAY_DU'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="DAY_DU">An Toàn / Đầy Đủ</option>
                <option value="SAP_HET">Cảnh Báo Sắp Hết Hàng (Min)</option>
                <option value="VUOT_DINH_MUC">Cảnh Báo Vượt Định Mức (Max)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
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
