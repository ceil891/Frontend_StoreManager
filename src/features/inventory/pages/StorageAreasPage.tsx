import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, MapPin, Grid } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bãi kho lưu trữ (Storage Areas)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Xem và cấu hình các bãi kho lưu trữ chính trực thuộc các phân khu (Zones) trong kho của từng chi nhánh.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm Bãi Kho
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã bãi kho, tên bãi kho, phân khu, chi nhánh..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết bãi kho: ${selected?.areaName}`}
        size="erp"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Mã bãi kho</span>
                <p className="font-mono font-bold text-emerald-600 text-base">{selected.areaCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Tên bãi kho</span>
                <p className="font-bold text-gray-900 dark:text-white text-base">{selected.areaName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Thuộc phân khu (Zone)</span>
                <p className="font-semibold text-purple-600 dark:text-purple-400">{selected.zoneName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Chi nhánh quản lý</span>
                <p className="font-semibold text-blue-600 dark:text-blue-400">{selected.branchName || 'Toàn hệ thống'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Trạng thái vận hành</span>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selected.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {selected.isActive ? '🟢 Đang hoạt động' : '🔴 Tạm khóa bãi'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Thủ kho phụ trách</span>
                <p className="font-semibold text-gray-900 dark:text-white">{(selected as any).managerName || 'Trần Thủ Kho (CN Chính)'}</p>
              </div>
            </div>

            {selected.description && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <span className="text-xs text-gray-500 block mb-1">Ghi chú & Quy định lưu trữ</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selected.description}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm bãi kho (Storage Area) mới' : 'Chỉnh sửa thông tin bãi kho'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã bãi kho *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, areaCode: `AREA-${Math.floor(100 + Math.random() * 900)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.areaCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaCode: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Ví dụ: AREA-A1, AREA-B2..."
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên bãi kho *</label>
              <input
                type="text"
                value={editingItem.areaName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Ví dụ: Bãi hàng khô A1, Khu nguyên liệu B..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phân khu (zone) *</label>
              <select
                value={editingItem.zoneId || ''}
                onChange={(e) => setEditingItem({ ...editingItem, zoneId: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái *</label>
              <select
                value={editingItem.isActive === false ? 'false' : 'true'}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'true' })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="true">🟢 Hoạt động</option>
                <option value="false">🔴 Tạm khóa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Diện tích bãi (m²)</label>
              <input
                type="number"
                value={(editingItem as any).areaSizeM2 || ''}
                onChange={(e) => setEditingItem({ ...editingItem, areaSizeM2: Number(e.target.value) } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Ví dụ: 150"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Điều kiện bảo quản</label>
              <select
                value={(editingItem as any).storageCondition || 'NORMAL'}
                onChange={(e) => setEditingItem({ ...editingItem, storageCondition: e.target.value } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="NORMAL">Nhiệt độ thường (15 - 25°C)</option>
                <option value="COLD">Kho lạnh (0 - 5°C)</option>
                <option value="FROZEN">Kho đông (-18°C)</option>
                <option value="HAZMAT">Hóa chất / Hàng nguy hiểm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mô tả / Ghi Chú vận hành</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Ghi chú vận hành, loại hàng hóa lưu trữ tối ưu..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors font-semibold">
              Lưu bãi kho
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default StorageAreasPage;

