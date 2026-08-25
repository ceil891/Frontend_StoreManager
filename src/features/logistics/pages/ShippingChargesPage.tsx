import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Scale, MapPin, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


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
    return `${Number(val || 0).toLocaleString('vi-VN')} đ`;
  };

  const columns = useMemo<ColumnDef<ShippingChargeRecord>[]>(
    () => [
      {
        accessorKey: 'chargeCode',
        header: 'Mã cấu hình',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'shippingMethod',
        header: 'Hình thức',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
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
        cell: (info) => <span className="font-mono text-primary font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
          const label = status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng';
          return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-primary rounded transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biểu phí cước vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và cấu hình định mức cước phí giao hàng dựa trên các tiêu chí khoảng cách địa lý và trọng lượng của đơn hàng
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới biểu phí cước
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã cấu hình cước, hình thức vận chuyển..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Thông tin cấu hình cước: ${selected?.chargeCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 block mb-1">Mã cấu hình:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.chargeCode}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Hình thức vận chuyển:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.shippingMethod}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> Cự ly tối đa:
                </span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.maxDistanceKm} km</p>
              </div>
              <div>
                <span className="text-gray-500 flex items-center gap-1 mb-1">
                  <Scale className="w-4 h-4 text-gray-400" /> Trọng lượng tối đa:
                </span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.maxWeightKg} kg</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-gray-500 block mb-1">Đơn giá vận chuyển:</span>
                <p className="font-mono font-bold text-primary text-base">{formatCurrency(selected.pricePerUnit)}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Phụ phí cồng kềnh:</span>
                <p className="font-mono text-red-500 font-semibold">{formatCurrency(selected.oversizeSurcharge)}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <span className="text-gray-500 block mb-1">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selected.status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-gray-500 block mb-1">Ghi chú thêm:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg text-gray-700 dark:text-gray-300 text-xs border border-gray-200 dark:border-gray-800">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
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
        title={modalMode === 'create' ? 'Thêm mới cấu hình cước' : 'Cập nhật cấu hình cước'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã cấu hình cước *</label>
              <input
                type="text"
                value={editingItem.chargeCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, chargeCode: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-primary"
                placeholder="SC-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Hình thức giao *</label>
              <input
                type="text"
                value={editingItem.shippingMethod || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shippingMethod: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ví dụ: Giao tiêu chuẩn"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Khoảng cách tối đa (km) *</label>
              <input
                type="number"
                value={editingItem.maxDistanceKm || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxDistanceKm: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Khối lượng tối đa (kg) *</label>
              <input
                type="number"
                value={editingItem.maxWeightKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn giá vận chuyển *</label>
              <input
                type="number"
                value={editingItem.pricePerUnit || 0}
                onChange={(e) => setEditingItem({ ...editingItem, pricePerUnit: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Phụ phí cồng kềnh</label>
              <input
                type="number"
                value={editingItem.oversizeSurcharge || 0}
                onChange={(e) => setEditingItem({ ...editingItem, oversizeSurcharge: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
            >
              <option value="ACTIVE">Đang áp dụng</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              rows={2}
              placeholder="Chi tiết cấu hình..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingChargesPage;
