import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShieldAlert, Thermometer, Layers, Warehouse, CheckCircle2, XCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface WarehouseZoneRecord {
  id: string;
  zoneCode: string;
  zoneName: string;
  condition: string; // Điều kiện nhiệt độ/độ ẩm
  capacity: number; // Dung lượng chứa hàng (Pallet)
  branchName: string; // Chi nhánh sở hữu
  status: 'HOẠT_ĐỘNG' | 'TẠM_NGƯNG';
  description?: string;
}

const MOCK_ZONES: WarehouseZoneRecord[] = [
  {
    id: '1',
    zoneCode: 'ZONE-A',
    zoneName: 'Khu vực hàng khô & thực phẩm đóng gói',
    condition: 'Nhiệt độ thường (25-30°C), Độ ẩm < 60%',
    capacity: 500,
    branchName: 'Chi nhánh Quận 1',
    status: 'HOẠT_ĐỘNG',
    description: 'Lưu trữ các loại nước ngọt, mì gói, bánh kẹo và gia vị đóng hộp.',
  },
  {
    id: '2',
    zoneCode: 'ZONE-B',
    zoneName: 'Phòng lạnh bảo quản sản phẩm sữa & bơ',
    condition: 'Nhiệt độ mát (2-8°C), Độ ẩm 50%',
    capacity: 150,
    branchName: 'Chi nhánh Quận 1',
    status: 'HOẠT_ĐỘNG',
    description: 'Khu vực vô trùng, chuyên biệt cho sữa chua, bơ lạt, và nước trái cây.',
  },
  {
    id: '3',
    zoneCode: 'ZONE-C',
    zoneName: 'Khu đông lạnh sâu (Thủy hải sản & Thịt)',
    condition: 'Nhiệt độ đông (-18°C đến -22°C)',
    capacity: 100,
    branchName: 'Tổng kho Thủ Đức',
    status: 'HOẠT_ĐỘNG',
    description: 'Hàng nhập khẩu tươi sống, yêu cầu giám sát nhiệt độ 24/7.',
  },
  {
    id: '4',
    zoneCode: 'ZONE-D',
    zoneName: 'Khu hàng mẫu & hàng chờ thanh lý',
    condition: 'Nhiệt độ thường (25-35°C)',
    capacity: 50,
    branchName: 'Tổng kho Thủ Đức',
    status: 'TẠM_NGƯNG',
    description: 'Chứa các sản phẩm cận date hoặc lỗi bao bì chờ xử lý huỷ.',
  },
];

export function WarehouseZonesPage() {
  const [data, setData] = useState<WarehouseZoneRecord[]>(MOCK_ZONES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WarehouseZoneRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarehouseZoneRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.zoneCode.toLowerCase().includes(q) ||
        d.zoneName.toLowerCase().includes(q) ||
        d.branchName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      zoneCode: `ZONE-${String.fromCharCode(65 + data.length)}`,
      zoneName: '',
      condition: 'Nhiệt độ thường (25-30°C)',
      capacity: 100,
      branchName: 'Chi nhánh Quận 1',
      status: 'HOẠT_ĐỘNG',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarehouseZoneRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.zoneCode || !editingItem.zoneName || !editingItem.branchName) return;

    if (modalMode === 'create') {
      const newItem: WarehouseZoneRecord = {
        id: String(data.length + 1),
        zoneCode: editingItem.zoneCode!,
        zoneName: editingItem.zoneName!,
        condition: editingItem.condition || 'Nhiệt độ thường',
        capacity: Number(editingItem.capacity || 0),
        branchName: editingItem.branchName!,
        status: editingItem.status as any || 'HOẠT_ĐỘNG',
        description: editingItem.description,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as WarehouseZoneRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phân khu kho này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<WarehouseZoneRecord>[]>(
    () => [
      {
        accessorKey: 'zoneCode',
        header: 'Mã Phân Khu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'zoneName',
        header: 'Tên Phân Khu Kho',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'condition',
        header: 'Điều Kiện Bảo Quản',
        cell: (info) => (
          <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Thermometer className="w-3.5 h-3.5 text-orange-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'capacity',
        header: 'Sức Chứa (Pallet)',
        cell: (info) => (
          <span className="font-mono font-bold flex items-center gap-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            {info.getValue() as number} Pallets
          </span>
        ),
      },
      {
        accessorKey: 'branchName',
        header: 'Chi Nhánh Sở Hữu',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs">
            <Warehouse className="w-3.5 h-3.5 text-gray-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const isActive = status === 'HOẠT_ĐỘNG';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh Sách Phân Khu Kho</h1>
          <p className="text-sm text-gray-500">
            Quản lý các khu vực phân kho theo nhiệt độ, sức chứa pallet và phân chia quản lý chi nhánh.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Phân Khu Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phân khu, tên phân khu kho, chi nhánh sở hữu..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer Xem Chi Tiết */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phân Khu: ${selected?.zoneCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Mã Phân Khu:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.zoneCode}</p>
              </div>
              <div>
                <span className="text-gray-400">Trạng Thái:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'HOẠT_ĐỘNG'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Tên Phân Khu Kho:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{selected.zoneName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Sức Chứa Tối Đa:</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.capacity} Pallet</p>
              </div>
              <div>
                <span className="text-gray-400">Chi Nhánh Quản Lý:</span>
                <p className="text-gray-900 dark:text-white">{selected.branchName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Điều Kiện Bảo Quản:</span>
              <p className="text-gray-900 dark:text-white">{selected.condition}</p>
            </div>
            {selected.description && (
              <div>
                <span className="text-gray-400">Mô Tả Phân Khu:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded text-gray-800 dark:text-gray-300">
                  {selected.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal Thêm/Sửa Phân Khu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai Báo Phân Khu Kho Mới' : 'Cập Nhật Thông Tin Phân Khu'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phân Khu *</label>
              <input
                type="text"
                value={editingItem.zoneCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, zoneCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sức Chứa (Pallet) *</label>
              <input
                type="number"
                value={editingItem.capacity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, capacity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
                min={1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Phân Khu Kho *</label>
            <input
              type="text"
              value={editingItem.zoneName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, zoneName: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              placeholder="Ví dụ: Phòng mát bảo quản sữa"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Điều Kiện Bảo Quản *</label>
            <input
              type="text"
              value={editingItem.condition || ''}
              onChange={(e) => setEditingItem({ ...editingItem, condition: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              placeholder="Ví dụ: Nhiệt độ 2-8°C, Độ ẩm < 50%"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chi Nhánh Sở Hữu *</label>
              <input
                type="text"
                value={editingItem.branchName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, branchName: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái Hoạt Động *</label>
              <select
                value={editingItem.status || 'HOẠT_ĐỘNG'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              >
                <option value="HOẠT_ĐỘNG">Hoạt động</option>
                <option value="TẠM_NGƯNG">Tạm ngưng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô Tả Phân Khu</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              rows={3}
              placeholder="Nhập ghi chú chi tiết về loại hàng bảo quản hoặc lưu ý..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">
              {modalMode === 'create' ? 'Tạo Phân Khu' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
