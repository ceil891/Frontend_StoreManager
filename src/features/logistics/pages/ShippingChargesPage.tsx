import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Scale, MapPin, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useLogisticsStore } from '../store/logisticsStore';

interface ShippingChargeRecord {
  id: string;
  chargeCode: string;
  maxDistanceKm: number;
  maxWeightKg: number;
  pricePerUnit: number;
  shippingMethod: string;
  oversizeSurcharge: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export function ShippingChargesPage() {
  const {
    shippingCharges: storeCharges,
    fetchShippingCharges,
    addShippingCharge,
    updateShippingCharge,
    deleteShippingCharge,
  } = useLogisticsStore();

  useEffect(() => {
    fetchShippingCharges();
  }, [fetchShippingCharges]);

  const data: ShippingChargeRecord[] = useMemo(() => {
    return storeCharges.map((s) => ({
      id: s.id,
      chargeCode: s.zoneCode,
      maxDistanceKm: 50,
      maxWeightKg: 10,
      pricePerUnit: s.baseFee,
      shippingMethod: `${s.carrierName} - ${s.zoneName}`,
      oversizeSurcharge: s.perKgFee,
      status: s.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      notes: `Thời gian dự kiến: ${s.estimatedHours}h`,
    }));
  }, [storeCharges]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingChargeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingChargeRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.chargeCode.toLowerCase().includes(q) ||
        d.shippingMethod.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      chargeCode: '',
      maxDistanceKm: 0,
      maxWeightKg: 0,
      pricePerUnit: 0,
      shippingMethod: '',
      oversizeSurcharge: 0,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingChargeRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      await addShippingCharge({
        zoneCode: editingItem.chargeCode || 'ZONE-01',
        zoneName: editingItem.shippingMethod || 'Khu vực mới',
        carrierName: 'Đối tác giao hàng',
        baseFee: Number(editingItem.pricePerUnit || 0),
        perKgFee: Number(editingItem.oversizeSurcharge || 0),
        estimatedHours: 24,
        status: 'ACTIVE',
      });
    } else if (editingItem.id) {
      await updateShippingCharge(editingItem.id, {
        baseFee: Number(editingItem.pricePerUnit || 0),
        perKgFee: Number(editingItem.oversizeSurcharge || 0),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cấu hình phí vận chuyển này?')) {
      await deleteShippingCharge(id);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ShippingChargeRecord>[]>(
    () => [
      {
        accessorKey: 'chargeCode',
        header: 'Mã cấu hình',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'shippingMethod',
        header: 'Hình thức',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'maxDistanceKm',
        header: 'Khoảng cách tối đa',
        cell: (info) => <span className="font-mono">{info.getValue() as number} km</span>,
      },
      {
        accessorKey: 'maxWeightKg',
        header: 'Khối lượng tối đa',
        cell: (info) => <span className="font-mono">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'pricePerUnit',
        header: 'Đơn giá vận chuyển',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng';
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
              title="Xem chi tiết"
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
          <h1 className="text-2xl font-bold">Biểu phí cước vận chuyển (shipping charges)</h1>
          <p className="text-sm text-gray-500">
            Quản lý và cấu hình định mức cước phí giao hàng dựa trên các tiêu chí khoảng cách địa lý và trọng lượng của đơn hàng sỉ/lẻ.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Biểu Phí Cước
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã cấu hình cước, hình thức vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết cấu hình cước: ${selected?.chargeCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã cấu hình:</span>
                <p className="font-mono font-semibold">{selected.chargeCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Hình thức vận chuyển:</span>
                <p className="font-semibold">{selected.shippingMethod}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> Cự ly tối đa:
                </span>
                <p className="font-mono font-semibold">{selected.maxDistanceKm} km</p>
              </div>
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Scale className="w-4 h-4 text-gray-400" /> Trọng lượng tối đa:
                </span>
                <p className="font-mono font-semibold">{selected.maxWeightKg} kg</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Đơn giá vận chuyển:</span>
                <p className="font-mono font-bold text-emerald-600 text-base">{formatCurrency(selected.pricePerUnit)}</p>
              </div>
              <div>
                <span className="text-gray-500">Phụ phí cồng kềnh:</span>
                <p className="font-mono text-red-500">{formatCurrency(selected.oversizeSurcharge)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú thêm:</span>
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
        title={modalMode === 'create' ? 'Thêm cấu hình cước mới' : 'Sửa cấu hình cước'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã cấu hình cước *</label>
              <input
                type="text"
                value={editingItem.chargeCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, chargeCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SC-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hình thức giao *</label>
              <input
                type="text"
                value={editingItem.shippingMethod || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shippingMethod: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Ví dụ: Giao tiêu chuẩn"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Khoảng cách tối đa (km) *</label>
              <input
                type="number"
                value={editingItem.maxDistanceKm || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxDistanceKm: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trọng lượng tối đa (kg) *</label>
              <input
                type="number"
                value={editingItem.maxWeightKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn giá vận chuyển *</label>
              <input
                type="number"
                value={editingItem.pricePerUnit || 0}
                onChange={(e) => setEditingItem({ ...editingItem, pricePerUnit: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phụ phí cồng kềnh</label>
              <input
                type="number"
                value={editingItem.oversizeSurcharge || 0}
                onChange={(e) => setEditingItem({ ...editingItem, oversizeSurcharge: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="ACTIVE">Hoạt động / đang áp dụng</option>
              <option value="INACTIVE">Tạm ngưng áp dụng</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Chi tiết cấu hình..."
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
              Lưu cấu hình
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingChargesPage;
