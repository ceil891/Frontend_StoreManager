import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShieldAlert, Barcode, Grid, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

interface WarehouseBinRecord {
  id: string;
  binCode: string;
  barcode: string;
  zoneCode: string; // Phân khu kho
  maxCapacity: number; // Sức chứa tối đa (kg)
  maxVolume: number; // Thể tích tối đa (m3)
  status: 'CÒN_TRỐNG' | 'ĐẦY_HÀNG' | 'BẢO_TRÌ';
  description?: string;
}

export function WarehouseBinsPage() {
  const { warehouseBins, fetchWarehouseBins, addWarehouseBin, updateWarehouseBin, deleteWarehouseBin, warehouseZones, fetchWarehouseZones } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WarehouseBinRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarehouseBinRecord>>({});

  useEffect(() => {
    fetchWarehouseBins();
    fetchWarehouseZones();
  }, [fetchWarehouseBins, fetchWarehouseZones]);

  const data = useMemo<WarehouseBinRecord[]>(() => {
    return warehouseBins.map((b) => ({
      id: b.id,
      binCode: b.binCode,
      barcode: b.barcode,
      zoneCode: b.areaCode,
      maxCapacity: b.maxWeightKg,
      maxVolume: b.maxVolumeM3,
      status: b.status === 'FULL' ? 'ĐẦY_HÀNG' : 'CÒN_TRỐNG',
      description: b.notes,
    }));
  }, [warehouseBins]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.binCode.toLowerCase().includes(q) ||
        d.barcode.toLowerCase().includes(q) ||
        d.zoneCode.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      binCode: `BIN-A1-${String(data.length + 1).padStart(2, '0')}`,
      barcode: `BAR-A${data.length + 101}`,
      zoneCode: warehouseZones[0]?.zoneCode || 'ZONE-A',
      maxCapacity: 1000,
      maxVolume: 2.5,
      status: 'CÒN_TRỐNG',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarehouseBinRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.binCode || !editingItem.barcode || !editingItem.zoneCode) return;

    const areaCode = editingItem.zoneCode;
    const payload = {
      binCode: editingItem.binCode!,
      barcode: editingItem.barcode!,
      areaCode: areaCode,
      areaName: warehouseZones.find((z) => z.zoneCode === areaCode)?.zoneName || areaCode,
      maxWeightKg: Number(editingItem.maxCapacity || 0),
      maxVolumeM3: Number(editingItem.maxVolume || 0),
      status: editingItem.status === 'ĐẦY_HÀNG' ? ('FULL' as const) : ('EMPTY' as const),
      notes: editingItem.description,
    };

    if (modalMode === 'create') {
      await addWarehouseBin(payload);
    } else {
      await updateWarehouseBin(editingItem.id!, payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ô kệ này?')) {
      await deleteWarehouseBin(id);
    }
  };

  const columns = useMemo<ColumnDef<WarehouseBinRecord>[]>(
    () => [
      {
        accessorKey: 'binCode',
        header: 'Mã Ô Kệ',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'barcode',
        header: 'Mã Vạch Ô Kệ',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800">
            <Barcode className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'zoneCode',
        header: 'Phân Khu Kho',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs">
            <Grid className="w-3.5 h-3.5 text-blue-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'maxCapacity',
        header: 'Sức Chứa (kg)',
        cell: (info) => <span className="font-mono font-bold">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'maxVolume',
        header: 'Thể Tích (m³)',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as number} m³</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình Trạng',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let label = 'Còn Trống';

          if (status === 'ĐẦY_HÀNG') {
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            label = 'Đầy Hàng';
          } else if (status === 'BẢO_TRÌ') {
            badgeClass = 'bg-red-50 text-red-700 border-red-200';
            label = 'Bảo Trì';
          }

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
            >
              {status === 'CÒN_TRỐNG' && <CheckCircle2 className="w-3 h-3" />}
              {status === 'ĐẦY_HÀNG' && <Package className="w-3 h-3" />}
              {status === 'BẢO_TRÌ' && <AlertTriangle className="w-3 h-3" />}
              {label}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Ô Kệ / Ngăn Chứa</h1>
          <p className="text-sm text-gray-500">
            Xem, định danh mã vạch và phân loại vị trí chứa hàng thực tế chi tiết từng ô kệ thuộc các phân khu kho.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Ô Kệ Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã ô kệ, mã vạch ô kệ, thuộc phân khu kho..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer Xem Chi Tiết */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Ô Kệ: ${selected?.binCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Mã Ô Kệ:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.binCode}</p>
              </div>
              <div>
                <span className="text-gray-400">Mã Vạch Ô Kệ:</span>
                <p className="font-mono font-semibold text-gray-905 dark:text-white">{selected.barcode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Thuộc Phân Khu Kho:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{selected.zoneCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Tải Trọng Tối Đa (kg):</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.maxCapacity} kg</p>
              </div>
              <div>
                <span className="text-gray-400">Thể Tích Tối Đa (m³):</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.maxVolume} m³</p>
              </div>
            </div>
            <div>
              <span className="text-gray-400">Trạng Thái Khoang Chứa:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'CÒN_TRỐNG'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'ĐẦY_HÀNG'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'CÒN_TRỐNG' ? 'Còn Trống' : selected.status === 'ĐẦY_HÀNG' ? 'Đầy Hàng' : 'Đang Bảo Trì'}
                </span>
              </div>
            </div>
            {selected.description && (
              <div>
                <span className="text-gray-400">Mô Tả Chi Tiết Vị Trí:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded text-gray-800 dark:text-gray-300">
                  {selected.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal Thêm/Sửa Ô Kệ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khai Báo Vị Trí Ô Kệ Mới' : 'Cập Nhật Vị Trí Ô Kệ'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Ô Kệ *</label>
              <input
                type="text"
                value={editingItem.binCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, binCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Vạch Định Danh *</label>
              <input
                type="text"
                value={editingItem.barcode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phân Khu Kho *</label>
            <select
              value={editingItem.zoneCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, zoneCode: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              required
            >
              {warehouseZones.map((z) => (
                <option key={z.id} value={z.zoneCode}>
                  {z.zoneCode} ({z.zoneName})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sức Chứa Tải Trọng (kg) *</label>
              <input
                type="number"
                value={editingItem.maxCapacity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxCapacity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thể Tích Ô Kệ (m³) *</label>
              <input
                type="number"
                step="0.1"
                value={editingItem.maxVolume || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxVolume: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
                min={0.1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tình Trạng Ô Kệ *</label>
            <select
              value={editingItem.status || 'CÒN_TRỐNG'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
            >
              <option value="CÒN_TRỐNG">Còn Trống</option>
              <option value="ĐẦY_HÀNG">Đầy Hàng</option>
              <option value="BẢO_TRÌ">Bảo Trì / Khóa Vị Trí</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mô Tả Vị Trí</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              rows={3}
              placeholder="Nhập ghi chú chi tiết vị trí kệ..."
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
              {modalMode === 'create' ? 'Tạo Ô Kệ' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
