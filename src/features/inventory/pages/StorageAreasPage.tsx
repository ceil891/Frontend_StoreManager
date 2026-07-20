import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, MapPin, Grid } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type AreaRecord } from '@/features/inventory/store/inventoryStore';

export function StorageAreasPage() {
  const { areas, fetchAreas, addArea, updateArea, deleteArea, warehouseZones, fetchWarehouseZones } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AreaRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<AreaRecord>>({});

  useEffect(() => {
    fetchAreas();
    fetchWarehouseZones();
  }, [fetchAreas, fetchWarehouseZones]);

  const filtered = useMemo(() => {
    if (!search) return areas;
    const q = search.toLowerCase();
    return areas.filter(
      (d) =>
        d.areaCode.toLowerCase().includes(q) ||
        d.areaName.toLowerCase().includes(q) ||
        (d.zoneName && d.zoneName.toLowerCase().includes(q)) ||
        (d.branchName && d.branchName.toLowerCase().includes(q))
    );
  }, [search, areas]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      areaCode: '',
      areaName: '',
      zoneId: warehouseZones[0]?.id || '',
      isActive: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AreaRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.areaCode || !editingItem.areaName || !editingItem.zoneId) return;

    const payload = {
      areaCode: editingItem.areaCode.toUpperCase(),
      areaName: editingItem.areaName,
      zoneId: editingItem.zoneId,
      isActive: editingItem.isActive !== false,
      description: editingItem.description || '',
    };

    if (modalMode === 'create') {
      await addArea(payload);
    } else {
      await updateArea(editingItem.id!, payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bãi kho (Storage Area) này?')) {
      await deleteArea(id);
    }
  };

  const columns = useMemo<ColumnDef<AreaRecord>[]>(
    () => [
      {
        accessorKey: 'areaCode',
        header: 'Mã bãi kho',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'areaName',
        header: 'Tên bãi kho',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'zoneName',
        header: 'Thuộc phân khu (zone)',
        cell: (info) => <span className="font-semibold text-purple-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'branchName',
        header: 'Thuộc chi nhánh',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string || 'N/A'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: (info) => {
          const isActive = info.getValue() as boolean;
          const badgeClass = isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = isActive ? 'Hoạt động' : 'Tạm khóa';
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
              title="Xem chi tiết bãi kho"
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
    [areas]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bãi kho lưu trữ (storage areas)</h1>
          <p className="text-sm text-gray-500">
            Xem và cấu hình các bãi kho lưu trữ chính trực thuộc các phân khu (Zones) trong kho của từng chi nhánh.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Bãi Kho
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã bãi kho, tên bãi kho, phân khu, chi nhánh..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết bãi kho: ${selected?.areaName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã bãi kho:</span>
                <p className="font-mono font-semibold">{selected.areaCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Tên bãi kho:</span>
                <p className="font-semibold">{selected.areaName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Thuộc phân khu (zone):</span>
                <p className="font-semibold text-purple-600">{selected.zoneName}</p>
              </div>
              <div>
                <span className="text-gray-500">Chi nhánh quản lý:</span>
                <p className="font-semibold text-blue-600">{selected.branchName || 'N/A'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.isActive ? 'Hoạt động' : 'Tạm khóa'}
                </span>
              </div>
            </div>
            {selected.description && (
              <div>
                <span className="text-gray-500">Ghi chú vận hành:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm bãi kho mới' : 'Sửa bãi kho'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã bãi kho *</label>
              <input
                type="text"
                value={editingItem.areaCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="A1, A2, B1..."
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tên bãi kho *</label>
              <input
                type="text"
                value={editingItem.areaName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Bãi A1, Khu B..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phân khu (zone) *</label>
              <select
                value={editingItem.zoneId || ''}
                onChange={(e) => setEditingItem({ ...editingItem, zoneId: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">-- Chọn zone --</option>
                {warehouseZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zoneCode} - {z.zoneName} ({z.branchName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
              <select
                value={editingItem.isActive === false ? 'false' : 'true'}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'true' })}
                className="w-full p-2 border rounded"
              >
                <option value="true">Hoạt động</option>
                <option value="false">Tạm khóa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô tả / Ghi Chú</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú vận hành, mặt hàng lưu trữ chính..."
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
              Lưu bãi kho
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default StorageAreasPage;

