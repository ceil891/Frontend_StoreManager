import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ShippingFeeRecord {
  id: string;
  orderCode: string;
  customerName: string;
  calculatedFee: number;
  actualFee: number;
  discrepancy: number;
  carrierName: string;
  status: 'CHO_DUYET' | 'DONG_BO';
  notes?: string;
}

const MOCK_FEES: ShippingFeeRecord[] = [
  {
    id: '1',
    orderCode: 'SO-2026-001',
    customerName: 'Nguyễn Văn A',
    calculatedFee: 22000,
    actualFee: 22000,
    discrepancy: 0,
    carrierName: 'GHTK',
    status: 'DONG_BO',
    notes: 'Phí vận chuyển chuẩn khớp với báo giá hệ thống',
  },
  {
    id: '2',
    orderCode: 'SO-2026-002',
    customerName: 'Trần Thị B',
    calculatedFee: 35000,
    actualFee: 45000,
    discrepancy: 10000,
    carrierName: 'GHN',
    status: 'CHO_DUYET',
    notes: 'Chênh lệch 10,000đ do hàng cồng kềnh phát sinh lúc lấy hàng',
  },
];

export function ShippingFeesPage() {
  const [data, setData] = useState<ShippingFeeRecord[]>(MOCK_FEES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingFeeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ShippingFeeRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.orderCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenEdit = (item: ShippingFeeRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    setData(
      data.map((d) => {
        if (d.id === editingItem.id) {
          const act = Number(editingItem.actualFee || 0);
          const disc = act - d.calculatedFee;
          return {
            ...d,
            actualFee: act,
            discrepancy: disc,
            status: editingItem.status as any || d.status,
            notes: editingItem.notes,
          };
        }
        return d;
      })
    );
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ShippingFeeRecord>[]>(
    () => [
      {
        accessorKey: 'orderCode',
        header: 'Mã Đơn SO',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn Vị VC',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'calculatedFee',
        header: 'Phí Tạm Tính',
        cell: (info) => <span className="font-mono">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'actualFee',
        header: 'Phí Thực Tế',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'discrepancy',
        header: 'Chênh Lệch Phí',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className={`font-mono font-semibold ${val > 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {val > 0 ? `+${formatCurrency(val)}` : formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Đối Soát',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
          const label = status === 'DONG_BO' ? 'Đã Đồng Bộ' : 'Chờ Duyệt Chi';
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
              title="Xem Chi Tiết Phí"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Điều Chỉnh Phí"
            >
              <Edit className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold">Đối Soát Phí Vận Chuyển (Shipping Fees)</h1>
          <p className="text-sm text-gray-500">
            Xem và thực hiện đối soát chi phí giao nhận thực tế từ các hãng vận chuyển ngoài so với chi phí tạm tính trên đơn hàng.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã đơn SO, tên khách hàng, hãng vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Đối soát phí đơn: ${selected?.orderCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Đơn SO:</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Hãng Vận Chuyển:</span>
                <p className="font-semibold">{selected.carrierName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold text-base">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Phí Tạm Tính:</span>
                <p className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(selected.calculatedFee)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-blue-600">Phí Thực Tế:</span>
                <p className="font-mono font-bold text-blue-600 text-lg">{formatCurrency(selected.actualFee)}</p>
              </div>
              <div>
                <span className="text-gray-500">Chênh Lệch Phí:</span>
                <p className="font-mono font-bold text-red-500">{formatCurrency(selected.discrepancy)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status === 'DONG_BO' ? 'Đã Đối Soát & Khớp Phí' : 'Đang Chờ Duyệt Chi Phụ Phí'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Đối Soát:</span>
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
        title="Đối Soát / Điều Chỉnh Phí Thực Tế"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đơn Hàng</label>
            <p className="font-semibold text-sm">{editingItem.customerName} ({editingItem.orderCode})</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phí Thực Tế Giao Hàng Hãng Thu (VND) *</label>
            <input
              type="number"
              value={editingItem.actualFee || 0}
              onChange={(e) => setEditingItem({ ...editingItem, actualFee: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Đối Soát *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt Chi (Có chênh lệch)</option>
              <option value="DONG_BO">Đồng Ý Khớp (Cập nhật doanh thu/chi phí)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Lý do chênh lệch phí..."
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
              Lưu Kết Quả
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeesPage;
