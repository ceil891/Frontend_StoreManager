import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Grid, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

interface StorageAreaRecord {
  id: string;
  areaCode: string;
  areaName: string;
  branchName: string;
  storageCondition: 'NORMAL' | 'COOL' | 'FREEZE';
  capacityPallets: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export function StorageAreasPage() {
  const { warehouseZones, fetchWarehouseZones, addWarehouseZone, updateWarehouseZone, deleteWarehouseZone } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StorageAreaRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<StorageAreaRecord>>({});

  useEffect(() => {
    fetchWarehouseZones();
  }, [fetchWarehouseZones]);

  const data = useMemo<StorageAreaRecord[]>(() => {
    return warehouseZones.map((z) => ({
      id: z.id,
      areaCode: z.zoneCode,
      areaName: z.zoneName,
      branchName: z.branchName,
      storageCondition: z.condition === 'Phòng lạnh bảo quản sản phẩm sữa & bơ' || z.condition === 'COOL' ? 'COOL' : z.condition === 'FREEZE' ? 'FREEZE' : 'NORMAL',
      capacityPallets: z.capacity || 100,
      status: z.status === 'TẠM_NGƯNG' ? 'INACTIVE' : 'ACTIVE',
      notes: z.description,
    }));
  }, [warehouseZones]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.areaCode.toLowerCase().includes(q) ||
        d.areaName.toLowerCase().includes(q) ||
        d.branchName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      areaCode: '',
      areaName: '',
      branchName: 'Chi nhánh Quận 1',
      storageCondition: 'NORMAL',
      capacityPallets: 100,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StorageAreaRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.areaCode || !editingItem.areaName) return;

    const payload = {
      zoneCode: editingItem.areaCode.toUpperCase(),
      zoneName: editingItem.areaName!,
      condition: editingItem.storageCondition || 'NORMAL',
      capacity: Number(editingItem.capacityPallets || 0),
      branchName: editingItem.branchName || 'Chi nhánh Quận 1',
      status: editingItem.status === 'INACTIVE' ? ('TẠM_NGƯNG' as const) : ('HOẠT_ĐỘNG' as const),
      description: editingItem.notes,
    };

    if (modalMode === 'create') {
      await addWarehouseZone(payload);
    } else {
      await updateWarehouseZone(editingItem.id!, payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phân khu kho này?')) {
      await deleteWarehouseZone(id);
    }
  };

  const columns = useMemo<ColumnDef<StorageAreaRecord>[]>(
    () => [
      {
        accessorKey: 'areaCode',
        header: 'Mã Phân Khu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'areaName',
        header: 'Tên Phân Khu',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'branchName',
        header: 'Thuộc Chi Nhánh',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'storageCondition',
        header: 'Điều Kiện Bảo Quản',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Nhiệt Độ Thường';
          let color = 'text-gray-700 bg-gray-50';
          if (val === 'COOL') {
            label = 'Hàng Mát (2-15°C)';
            color = 'text-teal-600 bg-teal-50';
          } else if (val === 'FREEZE') {
            label = 'Đông Lạnh (< 0°C)';
            color = 'text-blue-600 bg-blue-50';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'capacityPallets',
        header: 'Sức Chứa (Pallets)',
        cell: (info) => <span className="font-mono">{info.getValue() as number} kệ</span>,
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
              title="Xem Chi Tiết Khu"
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
          <h1 className="text-2xl font-bold">Phân Khu Lưu Trữ Nội Bộ (Storage Areas)</h1>
          <p className="text-sm text-gray-500">
            Xem và cấu hình các phân khu lưu trữ chính trong kho của từng chi nhánh, quản lý điều kiện bảo quản thực phẩm/hàng hóa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Phân Khu Kho
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <MapPin className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phân khu, tên phân khu, chi nhánh..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết phân khu: ${selected?.areaName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phân Khu:</span>
                <p className="font-mono font-semibold">{selected.areaCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Chi Nhánh Quản Lý:</span>
                <p className="font-semibold text-blue-600">{selected.branchName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Phân Khu Kho:</span>
              <p className="font-semibold text-base">{selected.areaName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Điều Kiện Bảo Quản:</span>
                <p className="font-semibold text-teal-600">
                  {selected.storageCondition === 'NORMAL' ? 'Nhiệt Độ Thường' : selected.storageCondition === 'COOL' ? 'Hàng Mát' : 'Đông Lạnh'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Sức Chứa Pallets:</span>
                <p className="font-mono font-semibold">{selected.capacityPallets} kệ</p>
              </div>
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
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vận Hành:</span>
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
        title={modalMode === 'create' ? 'Thêm Phân Khu Kho Mới' : 'Sửa Phân Khu Kho'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phân Khu *</label>
              <input
                type="text"
                value={editingItem.areaCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="ZA-XX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chi Nhánh Quản Lý *</label>
              <input
                type="text"
                value={editingItem.branchName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, branchName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Chọn chi nhánh"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Phân Khu Kho *</label>
            <input
              type="text"
              value={editingItem.areaName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, areaName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên phân khu chi tiết"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Điều Kiện Bảo Quản *</label>
              <select
                value={editingItem.storageCondition || 'NORMAL'}
                onChange={(e) => setEditingItem({ ...editingItem, storageCondition: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="NORMAL">Nhiệt Độ Thường</option>
                <option value="COOL">Hàng Mát (2-15°C)</option>
                <option value="FREEZE">Đông Lạnh (&lt; 0°C)</option>
              </select>
            </div>
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
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="ACTIVE">Hoạt Động</option>
              <option value="INACTIVE">Tạm Khóa (Đang xử lý dọn dẹp bãi)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú vận hành, thời gian bốc dỡ hàng..."
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
              Lưu Phân Khu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default StorageAreasPage;
