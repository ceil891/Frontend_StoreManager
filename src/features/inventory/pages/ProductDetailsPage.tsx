import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Tag, Layers, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

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
}

const MOCK_PRODUCTS: ProductDetailRecord[] = [
  {
    id: '1',
    barcode: '8934563123456',
    productName: 'Sữa tươi tiệt trùng Vinamilk ít đường 1L',
    categoryName: 'Sữa & Sản phẩm từ sữa',
    brand: 'Vinamilk',
    sellingPrice: 32000,
    costPrice: 26000,
    status: 'DANG_KINH_DOANH',
    notes: 'Sản phẩm tiêu dùng thiết yếu bán chạy nhất quý 1/2026',
  },
  {
    id: '2',
    barcode: '8934563123457',
    productName: 'Nước ngọt Coca Cola chai 1.5L',
    categoryName: 'Nước giải khát',
    brand: 'Coca-Cola',
    sellingPrice: 20000,
    costPrice: 15500,
    status: 'DANG_KINH_DOANH',
  },
  {
    id: '3',
    barcode: '8934563123458',
    productName: 'Bánh quy kem Oreo hộp giấy 248g',
    categoryName: 'Bánh kẹo',
    brand: 'Oreo',
    sellingPrice: 45000,
    costPrice: 38000,
    status: 'NGUNG_KINH_DOANH',
    notes: 'Ngừng kinh doanh mẫu hộp giấy để chuyển sang bao bì nhựa mới',
  },
];

export function ProductDetailsPage() {
  const [data, setData] = useState<ProductDetailRecord[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductDetailRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ProductDetailRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.barcode.includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.categoryName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      barcode: '',
      productName: '',
      categoryName: '',
      brand: '',
      sellingPrice: 0,
      costPrice: 0,
      status: 'DANG_KINH_DOANH',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductDetailRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.barcode || !editingItem.productName) return;

    if (modalMode === 'create') {
      const newItem: ProductDetailRecord = {
        id: String(data.length + 1),
        barcode: editingItem.barcode!,
        productName: editingItem.productName!,
        categoryName: editingItem.categoryName || 'Mặc định',
        brand: editingItem.brand || 'Không có',
        sellingPrice: Number(editingItem.sellingPrice || 0),
        costPrice: Number(editingItem.costPrice || 0),
        status: editingItem.status as any || 'DANG_KINH_DOANH',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as ProductDetailRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ProductDetailRecord>[]>(
    () => [
      {
        accessorKey: 'barcode',
        header: 'Mã barcode',
        cell: (info) => <span className="font-mono font-semibold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'categoryName',
        header: 'Danh mục',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'brand',
        header: 'Thương hiệu',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sellingPrice',
        header: 'Giá bán',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
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
              title="Xem chi tiết sản phẩm"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
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
          <h1 className="text-2xl font-bold">Danh mục sản phẩm chi tiết</h1>
          <p className="text-sm text-gray-500">
            Quản lý cơ sở dữ liệu hàng hóa, thông tin mã vạch, giá nhập/bán, thương hiệu và trạng thái kinh doanh của cửa hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Sản Phẩm
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã barcode, tên sản phẩm, thương hiệu, danh mục..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết sản phẩm: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã vạch / barcode:</span>
                <p className="font-mono font-semibold">{selected.barcode}</p>
              </div>
              <div>
                <span className="text-gray-500">Thương hiệu:</span>
                <p className="font-semibold">{selected.brand}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên sản phẩm:</span>
              <p className="font-semibold text-base">{selected.productName}</p>
            </div>
            <div>
              <span className="text-gray-500">Danh mục phân loại:</span>
              <p className="font-semibold text-emerald-600">{selected.categoryName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Giá nhập (VND):</span>
                <p className="font-mono text-red-500 font-bold">{formatCurrency(selected.costPrice)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giá bán lẻ (VND):</span>
                <p className="font-mono text-emerald-600 font-bold text-lg">{formatCurrency(selected.sellingPrice)}</p>
              </div>
            </div>
            <div className="border-t pt-2">
              <span className="text-gray-500">Trạng thái kinh doanh:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Mô tả / ghi chú:</span>
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
        title={modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Sửa thông tin sản phẩm'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã vạch / barcode *</label>
              <input
                type="text"
                value={editingItem.barcode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="Mã vạch sản phẩm"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thương hiệu</label>
              <input
                type="text"
                value={editingItem.brand || ''}
                onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Vinamilk"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              value={editingItem.productName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên đầy đủ của mặt hàng"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Danh mục phân loại</label>
            <input
              type="text"
              value={editingItem.categoryName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Ví dụ: Đồ uống"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá nhập (VND) *</label>
              <input
                type="number"
                value={editingItem.costPrice || 0}
                onChange={(e) => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá bán lẻ (VND) *</label>
              <input
                type="number"
                value={editingItem.sellingPrice || 0}
                onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái kinh doanh *</label>
            <select
              value={editingItem.status || 'DANG_KINH_DOANH'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DANG_KINH_DOANH">Đang kinh doanh (bán hàng)</option>
              <option value="NGUNG_KINH_DOANH">Ngừng Kinh Doanh (Ẩn danh mục)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú chi tiết</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Mô tả đặc điểm sản phẩm..."
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
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
