import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SupplierProductRecord {
  id: string;
  supplierProductCode: string; // SKU code of supplier
  sku: string; // System SKU
  productName: string;
  supplierName: string;
  leadTimeDays: number; // Delivery speed in days
  costPrice: number;
  status: 'DANG_CUNG_CAP' | 'TAM_NGUNG';
  notes?: string;
}

const MOCK_SUPPLIER_PRODUCTS: SupplierProductRecord[] = [
  {
    id: '1',
    supplierProductCode: 'VND-MILK-100',
    sku: 'SKU-MILK-01',
    productName: 'Sữa Tươi Tiệt Trùng Vinamilk 1L',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    leadTimeDays: 3,
    costPrice: 25500,
    status: 'DANG_CUNG_CAP',
    notes: 'Được ưu đãi chiết khấu 2% nếu mua trên 1000 hộp',
  },
  {
    id: '2',
    supplierProductCode: 'VND-COKE-320',
    sku: 'SKU-COKE-02',
    productName: 'Nước Ngọt Coca Cola Lon 320ml',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    leadTimeDays: 5,
    costPrice: 15000,
    status: 'DANG_CUNG_CAP',
    notes: 'Đặt tối thiểu 10 thùng mỗi đợt',
  },
];

export function SupplierProductsPage() {
  const [data, setData] = useState<SupplierProductRecord[]>(MOCK_SUPPLIER_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierProductRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierProductRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.sku.toLowerCase().includes(q) ||
        d.supplierProductCode.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      supplierProductCode: '',
      sku: '',
      productName: '',
      supplierName: '',
      leadTimeDays: 1,
      costPrice: 0,
      status: 'DANG_CUNG_CAP',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierProductRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.supplierProductCode || !editingItem.sku || !editingItem.supplierName) return;

    if (modalMode === 'create') {
      const newItem: SupplierProductRecord = {
        id: String(data.length + 1),
        supplierProductCode: editingItem.supplierProductCode!.toUpperCase(),
        sku: editingItem.sku!.toUpperCase(),
        productName: editingItem.productName || 'Mặt hàng hệ thống',
        supplierName: editingItem.supplierName!,
        leadTimeDays: Number(editingItem.leadTimeDays || 1),
        costPrice: Number(editingItem.costPrice || 0),
        status: editingItem.status as any || 'DANG_CUNG_CAP',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SupplierProductRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mối liên kết hàng hóa nhà cung cấp này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SupplierProductRecord>[]>(
    () => [
      {
        accessorKey: 'supplierProductCode',
        header: 'Mã Hàng NCC',
        cell: (info) => <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sku',
        header: 'Mã SKU Hệ Thống',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên Sản Phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'costPrice',
        header: 'Giá Mua Thỏa Thuận',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Thời Gian Giao (Ngày)',
        cell: (info) => <span className="font-mono">{info.getValue() as number} ngày</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DANG_CUNG_CAP' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'DANG_CUNG_CAP' ? 'Đang Cung Cấp' : 'Tạm Ngưng';
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
              title="Xem Chi Tiết Liên Kết"
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
          <h1 className="text-2xl font-bold">Danh Mục Mặt Hàng Nhà Cung Cấp (Vendor Catalog)</h1>
          <p className="text-sm text-gray-500">
            Cấu hình mã hàng hóa của nhà cung cấp tương ứng với mã SKU hệ thống, lưu trữ mức giá nhập thỏa thuận của nhà cung cấp.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Liên Kết Mặt Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hàng NCC, mã SKU hệ thống, nhà cung cấp..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Liên kết mặt hàng: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU Đối Tác NCC:</span>
                <p className="font-mono font-semibold">{selected.supplierProductCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã SKU Hệ Thống:</span>
                <p className="font-mono font-semibold text-emerald-600">{selected.sku}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm:</span>
              <p className="font-semibold text-base">{selected.productName}</p>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
              <p className="font-semibold text-blue-600 text-base">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Giá Thỏa Thuận:</span>
                <p className="font-mono text-emerald-600 font-bold text-lg">{formatCurrency(selected.costPrice)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giao Hàng Dự Kiến:</span>
                <p className="font-mono font-semibold">{selected.leadTimeDays} ngày làm việc</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Cung Cấp:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DANG_CUNG_CAP' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DANG_CUNG_CAP' ? 'Đang Cung Cấp' : 'Tạm Ngưng Cung Cấp'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Hợp Đồng Giá:</span>
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
        title={modalMode === 'create' ? 'Tạo Liên Kết Hàng NCC Mới' : 'Sửa Liên Kết Hàng NCC'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã SKU NCC *</label>
              <input
                type="text"
                value={editingItem.supplierProductCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierProductCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="Mã SKU của NCC"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã SKU Hệ Thống *</label>
              <input
                type="text"
                value={editingItem.sku || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="Mã SKU của hệ thống"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Hàng Hóa Hệ Thống</label>
            <input
              type="text"
              value={editingItem.productName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Nhập tên sản phẩm để kiểm tra"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Nhà Cung Cấp *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Chọn nhà cung cấp đối tác"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá Mua Thỏa Thuận *</label>
              <input
                type="number"
                value={editingItem.costPrice || 0}
                onChange={(e) => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thời Gian Giao Hàng (Ngày) *</label>
              <input
                type="number"
                value={editingItem.leadTimeDays || 1}
                onChange={(e) => setEditingItem({ ...editingItem, leadTimeDays: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Cung Cấp</label>
            <select
              value={editingItem.status || 'DANG_CUNG_CAP'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DANG_CUNG_CAP">Đang Cung Cấp</option>
              <option value="TAM_NGUNG">Tạm Ngưng (Hết hàng lâu dài)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú chi tiết chiết khấu, MOQ..."
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
              Lưu Liên Kết
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupplierProductsPage;
