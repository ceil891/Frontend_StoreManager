import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Grid, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SupplierStorageRecord {
  id: string;
  storageCode: string;
  storageName: string;
  supplierWarehouseName: string;
  storageType: 'THUONG' | 'LANH' | 'MAT';
  capacityPallets: number;
  status: 'TRONG' | 'DAY' | 'TAM_KHOA';
  notes?: string;
}

const MOCK_STORAGE_ZONES: SupplierStorageRecord[] = [
  {
    id: '1',
    storageCode: 'SZ-GBL-A',
    storageName: 'Phân Khu A - Bánh kẹo & Hàng khô',
    supplierWarehouseName: 'Kho Đông Anh - Toàn Cầu',
    storageType: 'THUONG',
    capacityPallets: 100,
    status: 'DAY',
    notes: 'Khu bãi hàng khô đã xếp kín pallet sữa',
  },
  {
    id: '2',
    storageCode: 'SZ-ASI-F',
    storageName: 'Khu Đông Lạnh Thủy Hải Sản',
    supplierWarehouseName: 'Kho Cát Lái - Á Châu',
    storageType: 'LANH',
    capacityPallets: 50,
    status: 'TRONG',
    notes: 'Duy trì nhiệt độ âm 18 độ C cho thực phẩm đông lạnh',
  },
];

export function SupplierStoragesPage() {
  const [data, setData] = useState<SupplierStorageRecord[]>(MOCK_STORAGE_ZONES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierStorageRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierStorageRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.storageCode.toLowerCase().includes(q) ||
        d.storageName.toLowerCase().includes(q) ||
        d.supplierWarehouseName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      storageCode: '',
      storageName: '',
      supplierWarehouseName: '',
      storageType: 'THUONG',
      capacityPallets: 0,
      status: 'TRONG',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierStorageRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.storageCode || !editingItem.storageName || !editingItem.supplierWarehouseName) return;

    if (modalMode === 'create') {
      const newItem: SupplierStorageRecord = {
        id: String(data.length + 1),
        storageCode: editingItem.storageCode.toUpperCase(),
        storageName: editingItem.storageName!,
        supplierWarehouseName: editingItem.supplierWarehouseName!,
        storageType: editingItem.storageType as any || 'THUONG',
        capacityPallets: Number(editingItem.capacityPallets || 0),
        status: editingItem.status as any || 'TRONG',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SupplierStorageRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khu lưu trữ đối tác này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<SupplierStorageRecord>[]>(
    () => [
      {
        accessorKey: 'storageCode',
        header: 'Mã Khu Lưu Trữ',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'storageName',
        header: 'Tên Phân Khu Kho',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierWarehouseName',
        header: 'Thuộc Kho Đối Tác',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'storageType',
        header: 'Loại Lưu Trữ',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Nhiệt Độ Thường';
          let color = 'text-gray-700 bg-gray-50';
          if (val === 'LANH') {
            label = 'Đông Lạnh';
            color = 'text-blue-600 bg-blue-50';
          } else if (val === 'MAT') {
            label = 'Hàng Mát';
            color = 'text-teal-600 bg-teal-50';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'capacityPallets',
        header: 'Sức Chứa (Pallets)',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue() as number} kệ</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái Bãi',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'Còn Trống';
          if (status === 'DAY') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Đầy Hàng';
          } else if (status === 'TAM_KHOA') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Tạm Khóa';
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
              title="Xem Chi Tiết Khu Bãi"
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
          <h1 className="text-2xl font-bold">Khu Vực Lưu Trữ Kho Nhà Cung Cấp (Supplier Storages)</h1>
          <p className="text-sm text-gray-500">
            Xem bản đồ phân khu bãi chi tiết, điều kiện bảo quản nhiệt độ và sức chứa kệ hàng trong kho của đối tác.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Khu Lưu Trữ
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Grid className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phân khu, tên phân khu kho NCC, kho đối tác..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết khu lưu trữ: ${selected?.storageCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phân Khu:</span>
                <p className="font-mono font-semibold">{selected.storageCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại Bảo Quản:</span>
                <p className="font-semibold text-emerald-600">
                  {selected.storageType === 'THUONG' ? 'Nhiệt Độ Thường' : selected.storageType === 'LANH' ? 'Đông Lạnh (-18°C)' : 'Hàng Mát (2-8°C)'}
                </p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Phân Khu Kho NCC:</span>
              <p className="font-semibold text-base">{selected.storageName}</p>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> Thuộc Kho Đối Tác:
              </span>
              <p className="font-semibold text-blue-600">{selected.supplierWarehouseName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Sức Chứa Tối Đa:</span>
                <p className="font-mono font-semibold">{selected.capacityPallets} Pallets</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Bãi:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'TRONG'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'DAY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'TRONG' ? 'Còn Trống Kệ' : selected.status === 'DAY' ? 'Kệ Đầy Hàng' : 'Tạm Khóa'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Chi Tiết:</span>
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
        title={modalMode === 'create' ? 'Thêm Khu Vực Lưu Trữ Mới' : 'Sửa Thông Tin Khu Vực'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phân Khu *</label>
              <input
                type="text"
                value={editingItem.storageCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, storageCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SZ-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại Bảo Quản *</label>
              <select
                value={editingItem.storageType || 'THUONG'}
                onChange={(e) => setEditingItem({ ...editingItem, storageType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="THUONG">Nhiệt Độ Thường</option>
                <option value="LANH">Đông Lạnh (-18°C)</option>
                <option value="MAT">Hàng Mát (2-8°C)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên Phân Khu Kho *</label>
              <input
                type="text"
                value={editingItem.storageName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, storageName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Khu A - Bánh kẹo"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thuộc Kho Đối Tác *</label>
              <input
                type="text"
                value={editingItem.supplierWarehouseName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierWarehouseName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên kho nhà cung cấp sở hữu"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sức Chứa (Pallets) *</label>
              <input
                type="number"
                value={editingItem.capacityPallets || 0}
                onChange={(e) => setEditingItem({ ...editingItem, capacityPallets: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái Bãi *</label>
              <select
                value={editingItem.status || 'TRONG'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="TRONG">Còn Trống Kệ</option>
                <option value="DAY">Kệ Đầy Hàng</option>
                <option value="TAM_KHOA">Tạm Khóa (Đang xử lý dọn bãi)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết hàng hóa..."
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
              Lưu Khu Bãi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupplierStoragesPage;
