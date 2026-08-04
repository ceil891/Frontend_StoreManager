import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface ShippingFeeRateRecord {
  id: string;
  rateCode: string;
  carrierName: string;
  serviceTier: string;
  weightFromKg: number;
  weightToKg: number;
  baseRateVnd: number;
  nextKgRateVnd: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

const DEFAULT_RATES: ShippingFeeRateRecord[] = [
  {
    id: '1',
    rateCode: 'RATE-GHN-01',
    carrierName: 'Giao Hàng Nhanh',
    serviceTier: 'Giao Tiêu Chuẩn',
    weightFromKg: 0,
    weightToKg: 2,
    baseRateVnd: 22000,
    nextKgRateVnd: 5000,
    status: 'ACTIVE',
    notes: 'Áp dụng cho đơn giao nội thành TP.HCM & Hà Nội'
  },
  {
    id: '2',
    rateCode: 'RATE-VTP-02',
    carrierName: 'Viettel Post',
    serviceTier: 'Giao Hỏa Tốc',
    weightFromKg: 0,
    weightToKg: 1,
    baseRateVnd: 35000,
    nextKgRateVnd: 10000,
    status: 'ACTIVE',
    notes: 'Áp dụng chuyển phát nhanh liên tỉnh'
  }
];

export function ShippingFeeRatesPage() {
  const [data, setData] = useState<ShippingFeeRateRecord[]>(DEFAULT_RATES);
  const [search, setSearch] = useState('');
  const [selectedRate, setSelectedRate] = useState<ShippingFeeRateRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingFeeRateRecord>>({});

  const formatCurrency = (val: number) => `${Math.round(val).toLocaleString('vi-VN')} VNĐ`;

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      rateCode: `RATE-${Date.now().toString().slice(-4)}`,
      carrierName: 'Viettel Post',
      serviceTier: 'Giao Tiêu Chuẩn',
      weightFromKg: 0,
      weightToKg: 2,
      baseRateVnd: 25000,
      nextKgRateVnd: 5000,
      status: 'ACTIVE',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingFeeRateRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.rateCode || !editingItem.carrierName) {
      toast.error('Vui lòng nhập mã định mức và hãng vận chuyển!');
      return;
    }

    const newRecord: ShippingFeeRateRecord = {
      id: editingItem.id || String(Date.now()),
      rateCode: editingItem.rateCode || `RATE-${Date.now().toString().slice(-4)}`,
      carrierName: editingItem.carrierName || 'Viettel Post',
      serviceTier: editingItem.serviceTier || 'Giao Tiêu Chuẩn',
      weightFromKg: Number(editingItem.weightFromKg || 0),
      weightToKg: Number(editingItem.weightToKg || 0),
      baseRateVnd: Number(editingItem.baseRateVnd || 0),
      nextKgRateVnd: Number(editingItem.nextKgRateVnd || 0),
      status: editingItem.status || 'ACTIVE',
      notes: editingItem.notes || ''
    };

    if (modalMode === 'create') {
      setData(prev => [newRecord, ...prev]);
      toast.success('Thêm định mức cước phí mới thành công!');
    } else {
      setData(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
      toast.success('Cập nhật định mức cước phí thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa định mức cước này?')) {
      setData(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xóa định mức cước!');
      setSelectedRate(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      item =>
        item.rateCode.toLowerCase().includes(q) ||
        item.carrierName.toLowerCase().includes(q) ||
        item.serviceTier.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<ShippingFeeRateRecord>[]>(
    () => [
      {
        accessorKey: 'rateCode',
        header: 'Mã định mức',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đối tác & Dịch vụ',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.carrierName}</p>
            <p className="text-xs text-gray-500 font-medium">{row.original.serviceTier}</p>
          </div>
        ),
      },
      {
        accessorKey: 'weightToKg',
        header: 'Khung trọng lượng',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">{row.original.weightFromKg} kg - {row.original.weightToKg} kg</span>
        ),
      },
      {
        accessorKey: 'baseRateVnd',
        header: 'Cước cơ bản',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'nextKgRateVnd',
        header: 'Cước/kg tiếp theo',
        cell: (info) => <span className="font-mono font-semibold text-gray-700">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
            info.getValue() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {info.getValue() === 'ACTIVE' ? 'Hoạt động' : 'Ngưng áp dụng'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedRate(row.original)} className="p-1 text-gray-400 hover:text-emerald-600">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1 text-gray-400 hover:text-blue-600">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng giá cước vận chuyển</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình định mức cước phí cơ bản và phụ phí theo từng kg của các đối tác 3PL.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Định Mức Cước
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã định mức, đối tác vận chuyển, dịch vụ..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selectedRate}
        onClose={() => setSelectedRate(null)}
        title={selectedRate ? `Chi tiết định mức cước: ${selectedRate.rateCode}` : 'Thông tin định mức cước'}
        width="max-w-md"
      >
        {selectedRate && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Mã định mức:</span>
              <span className="font-mono font-bold text-emerald-600">{selectedRate.rateCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Đối tác 3PL:</span>
              <span className="font-bold">{selectedRate.carrierName} ({selectedRate.serviceTier})</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <div>
                <span className="text-gray-500 block">Cước cơ bản:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedRate.baseRateVnd)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phụ phí / kg tiếp theo:</span>
                <span className="font-mono font-bold text-gray-800">{formatCurrency(selectedRate.nextKgRateVnd)}</span>
              </div>
            </div>
            {selectedRate.notes && (
              <div>
                <span className="text-xs text-gray-400 block mb-1">Ghi chú áp dụng:</span>
                <p className="p-2.5 bg-gray-50 rounded-lg italic text-gray-700">{selectedRate.notes}</p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setSelectedRate(null)} className="px-4 py-2 bg-gray-100 font-bold rounded-lg">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa (Stripping leading zeros TC-SHIP-25) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Định Mức Cước Mới' : 'Sửa Định Mức Cước'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mã định mức *</label>
              <input
                type="text"
                value={editingItem.rateCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, rateCode: e.target.value })}
                required
                className="w-full p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Đối tác 3PL *</label>
              <input
                type="text"
                value={editingItem.carrierName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
                required
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Khung từ (kg)</label>
              <input
                type="text"
                value={editingItem.weightFromKg ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, weightFromKg: parseFloat(clean) || 0 });
                }}
                className="w-full p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Khung đến (kg)</label>
              <input
                type="text"
                value={editingItem.weightToKg ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, weightToKg: parseFloat(clean) || 0 });
                }}
                className="w-full p-2.5 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Cước cơ bản (VNĐ) *</label>
              <input
                type="text"
                value={editingItem.baseRateVnd ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, baseRateVnd: parseFloat(clean) || 0 });
                }}
                required
                className="w-full p-2.5 border rounded-lg font-mono text-emerald-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Cước/kg tiếp theo (VNĐ)</label>
              <input
                type="text"
                value={editingItem.nextKgRateVnd ?? 0}
                onChange={(e) => {
                  const clean = e.target.value.replace(/^0+(?=\d)/, '');
                  setEditingItem({ ...editingItem, nextKgRateVnd: parseFloat(clean) || 0 });
                }}
                className="w-full p-2.5 border rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng áp dụng</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">
              Hủy Bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg">
              Lưu Định Mức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeeRatesPage;

