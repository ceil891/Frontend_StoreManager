import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Grid, Box, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface WarehouseAreaRecord {
  id: string;
  binCode: string;
  barcode: string;
  areaCode: string; // Belongs to StorageArea
  areaName: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  status: 'EMPTY' | 'FULL';
  notes?: string;
}

const MOCK_BINS: WarehouseAreaRecord[] = [
  {
    id: '1',
    binCode: 'A1-03',
    barcode: 'BIN-ZA01-A103',
    areaCode: 'ZA-01',
    areaName: 'Khu Vực Hàng Tiêu Dùng - Hóa Mỹ Phẩm',
    maxWeightKg: 500,
    maxVolumeM3: 2.5,
    status: 'FULL',
    notes: 'Kệ chịu tải trọng cao, đã chứa đầy hộp bột giặt OMO',
  },
  {
    id: '2',
    binCode: 'B2-01',
    barcode: 'BIN-ZA02-B201',
    areaCode: 'ZA-02',
    areaName: 'Khu Mát - Sữa & Thực Phẩm Tươi',
    maxWeightKg: 200,
    maxVolumeM3: 1.0,
    status: 'EMPTY',
    notes: 'Khu kệ tầng 2, sạch sẽ thoáng mát',
  },
];

export function WarehouseAreasPage() {
  const [data, setData] = useState<WarehouseAreaRecord[]>(MOCK_BINS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WarehouseAreaRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarehouseAreaRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.binCode.toLowerCase().includes(q) ||
        d.barcode.toLowerCase().includes(q) ||
        d.areaName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      binCode: '',
      barcode: '',
      areaCode: '',
      areaName: '',
      maxWeightKg: 0,
      maxVolumeM3: 0,
      status: 'EMPTY',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarehouseAreaRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.binCode || !editingItem.barcode || !editingItem.areaName) return;

    if (modalMode === 'create') {
      const newItem: WarehouseAreaRecord = {
        id: String(data.length + 1),
        binCode: editingItem.binCode.toUpperCase(),
        barcode: editingItem.barcode.toUpperCase(),
        areaCode: editingItem.areaCode || 'ZA-01',
        areaName: editingItem.areaName!,
        maxWeightKg: Number(editingItem.maxWeightKg || 0),
        maxVolumeM3: Number(editingItem.maxVolumeM3 || 0),
        status: editingItem.status as any || 'EMPTY',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as WarehouseAreaRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông tin ô kệ ngăn chứa này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<WarehouseAreaRecord>[]>(
    () => [
      {
        accessorKey: 'binCode',
        header: 'Mã Ô Kệ',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'barcode',
        header: 'Mã Vạch Kệ',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'areaName',
        header: 'Thuộc Phân Khu Kho',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'maxWeightKg',
        header: 'Tải Trọng Tối Đa',
        cell: (info) => <span className="font-mono">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'maxVolumeM3',
        header: 'Thể Tích (m3)',
        cell: (info) => <span className="font-mono">{info.getValue() as number} m³</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'EMPTY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
          const label = status === 'EMPTY' ? 'Còn Trống' : 'Đầy Hàng';
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
              title="Xem Chi Tiết Ô Kệ"
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
          <h1 className="text-2xl font-bold">Vị Trí Ngăn Chứa & Ô Kệ Chi Tiết (Warehouse Areas)</h1>
          <p className="text-sm text-gray-500">
            Xem và cấu hình các ô kệ ngăn chứa, số lượng m3 tối đa chịu tải và mã vạch dán trên kệ hàng để thuận tiện cho việc lấy hàng POS/nhập kho.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Khai Báo Ô Kệ Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Box className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã ô kệ, mã vạch kệ, phân khu..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết ô kệ: ${selected?.binCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Số Ô Kệ:</span>
                <p className="font-mono font-semibold">{selected.binCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã Vạch Quét:</span>
                <p className="font-mono font-semibold">{selected.barcode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Phân Khu Kho Thuộc Về:</span>
              <p className="font-semibold text-blue-600 text-base">{selected.areaName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tải Trọng Tối Đa:</span>
                <p className="font-mono font-semibold">{selected.maxWeightKg} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Thể Tích Tối Đa:</span>
                <p className="font-mono font-semibold">{selected.maxVolumeM3} m³</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Ô Kệ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'EMPTY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status === 'EMPTY' ? 'Còn Trống' : 'Kệ Đã Đầy Hàng'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Ô Kệ:</span>
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
        title={modalMode === 'create' ? 'Khai Báo Ô Kệ Ngăn Chứa Mới' : 'Sửa Thông Tin Ô Kệ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Ô Kệ *</label>
              <input
                type="text"
                value={editingItem.binCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, binCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="A1-03..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Vạch Quét Kệ *</label>
              <input
                type="text"
                value={editingItem.barcode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="BIN-ZAXX-XXXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phân Khu *</label>
              <input
                type="text"
                value={editingItem.areaCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="ZA-01..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên Phân Khu Kho *</label>
              <input
                type="text"
                value={editingItem.areaName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Khu A - Thực phẩm mát"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tải Trọng Tối Đa (kg) *</label>
              <input
                type="number"
                value={editingItem.maxWeightKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thể Tích Tối Đa (m3) *</label>
              <input
                type="number"
                step="0.1"
                value={editingItem.maxVolumeM3 || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxVolumeM3: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'EMPTY'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="EMPTY">Còn Trống</option>
              <option value="FULL">Đầy Hàng</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết ghi chú ô kệ..."
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
              Lưu Ô Kệ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default WarehouseAreasPage;
