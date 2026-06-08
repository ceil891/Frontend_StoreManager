import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Truck, Clock, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ShippingMethodRecord {
  id: string;
  methodCode: string;
  methodName: string;
  description: string;
  estimatedHours: number;
  baseFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

const MOCK_METHODS: ShippingMethodRecord[] = [
  {
    id: '1',
    methodCode: 'SM-STANDARD',
    methodName: 'Giao Hàng Tiêu Chuẩn',
    description: 'Phương thức giao hàng bình thường qua bưu cục liên tỉnh hoặc nội tỉnh',
    estimatedHours: 48,
    baseFee: 22000,
    status: 'ACTIVE',
    notes: 'Miễn phí cho đơn hàng sỉ giá trị trên 5 triệu đồng',
  },
  {
    id: '2',
    methodCode: 'SM-EXPRESS',
    methodName: 'Giao Hàng Hỏa Tốc (2H)',
    description: 'Giao hàng nhanh bằng xe máy trong nội thành từ lúc chốt đơn hàng',
    estimatedHours: 2,
    baseFee: 45000,
    status: 'ACTIVE',
    notes: 'Chỉ áp dụng trong bán kính 10km quanh chi nhánh',
  },
];

export function ShippingMethodsPage() {
  const [data, setData] = useState<ShippingMethodRecord[]>(MOCK_METHODS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingMethodRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingMethodRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.methodCode.toLowerCase().includes(q) ||
        d.methodName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      methodCode: '',
      methodName: '',
      description: '',
      estimatedHours: 0,
      baseFee: 0,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingMethodRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.methodCode || !editingItem.methodName) return;

    if (modalMode === 'create') {
      const newItem: ShippingMethodRecord = {
        id: String(data.length + 1),
        methodCode: editingItem.methodCode.toUpperCase(),
        methodName: editingItem.methodName!,
        description: editingItem.description || '',
        estimatedHours: Number(editingItem.estimatedHours || 0),
        baseFee: Number(editingItem.baseFee || 0),
        status: editingItem.status as any || 'ACTIVE',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as ShippingMethodRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phương thức vận chuyển này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ShippingMethodRecord>[]>(
    () => [
      {
        accessorKey: 'methodCode',
        header: 'Mã Phương Thức',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'methodName',
        header: 'Tên Phương Thức',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedHours',
        header: 'Hạn Giao (Dự Kiến)',
        cell: (info) => <span className="font-mono">{info.getValue() as number} giờ</span>,
      },
      {
        accessorKey: 'baseFee',
        header: 'Phí Cơ Bản',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Khóa';
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
              title="Xem Chi Tiết"
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
          <h1 className="text-2xl font-bold">Hình Thức Giao Hàng (Shipping Methods)</h1>
          <p className="text-sm text-gray-500">
            Quản lý các hình thức vận chuyển, phí giao hàng cơ bản và thời gian giao hàng dự kiến phục vụ lên đơn bán hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Hình Thức
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phương thức, tên hình thức..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết hình thức: ${selected?.methodName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Hình Thức:</span>
                <p className="font-mono font-semibold">{selected.methodCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Phí Giao Cơ Bản:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.baseFee)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Hình Thức Vận Chuyển:</span>
              <p className="font-semibold text-base">{selected.methodName}</p>
            </div>
            <div>
              <span className="text-gray-500">Mô Tả Dịch Vụ:</span>
              <p className="text-gray-700 dark:text-gray-300">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" /> Hạn Giao Dự Kiến:
                </span>
                <p className="font-mono font-semibold">{selected.estimatedHours} giờ</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Khóa'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Thêm:</span>
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
        title={modalMode === 'create' ? 'Thêm Hình Thức Giao Hàng Mới' : 'Sửa Hình Thức'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phương Thức *</label>
              <input
                type="text"
                value={editingItem.methodCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, methodCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SM-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên Hình Thức *</label>
              <input
                type="text"
                value={editingItem.methodName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, methodName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên phương thức"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô Tả Dịch Vụ</label>
            <input
              type="text"
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Chi tiết cách thức giao hàng"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thời Gian Dự Kiến (Giờ) *</label>
              <input
                type="number"
                value={editingItem.estimatedHours || 0}
                onChange={(e) => setEditingItem({ ...editingItem, estimatedHours: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phí Giao Hàng Cơ Bản (VND) *</label>
              <input
                type="number"
                value={editingItem.baseFee || 0}
                onChange={(e) => setEditingItem({ ...editingItem, baseFee: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="ACTIVE">Hoạt Động</option>
              <option value="INACTIVE">Tạm Khóa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Ghi chú thêm..."
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
              Lưu Hình Thức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingMethodsPage;
