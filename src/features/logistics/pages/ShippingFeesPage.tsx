import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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

export function ShippingFeesPage() {
  const [data, setData] = useState<ShippingFeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingFeeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ShippingFeeRecord>>({});

  const fetchFees = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/fees');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          orderCode: item.orderCode || `SO-2026-${item.id}`,
          customerName: item.customerName || 'Khách vãng lai',
          calculatedFee: Number(item.calculatedFee || 30000),
          actualFee: Number(item.actualFee || 30000),
          discrepancy: Number((item.actualFee || 30000) - (item.calculatedFee || 30000)),
          carrierName: item.carrierName || 'GHTK',
          status: item.status || 'CHO_DUYET',
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách phí giao hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleOpenEdit = (item: ShippingFeeRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    try {
      const act = Number(editingItem.actualFee || 0);
      const disc = act - (editingItem.calculatedFee || 0);
      const payload = {
        id: Number(editingItem.id),
        orderCode: editingItem.orderCode,
        customerName: editingItem.customerName,
        calculatedFee: editingItem.calculatedFee,
        actualFee: act,
        discrepancy: disc,
        carrierName: editingItem.carrierName,
        status: editingItem.status,
        notes: editingItem.notes
      };
      await axiosClient.post('/logistics/fees', payload); // Backend support POST for save/update in static list
      toast.success('Lưu kết quả đối soát phí thành công!');
      setIsModalOpen(false);
      fetchFees();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu đối soát phí.');
    }
  };

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ShippingFeeRecord>[]>(
    () => [
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn SO',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị VC',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'calculatedFee',
        header: 'Phí tạm tính',
        cell: (info) => <span className="font-mono">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'actualFee',
        header: 'Phí thực tế',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'discrepancy',
        header: 'Chênh lệch phí',
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
        header: 'Đối soát',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
          const label = status === 'DONG_BO' ? 'Đã đồng bộ' : 'Chờ Duyệt chi';
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
              title="Xem chi tiết phí"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Điều chỉnh phí"
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
          <h1 className="text-2xl font-bold">Đối soát phí vận chuyển (shipping fees)</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách đối soát phí...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Đối soát phí đơn: ${selected?.orderCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã đơn SO:</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Hãng vận chuyển:</span>
                <p className="font-semibold">{selected.carrierName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold text-base">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Phí tạm tính:</span>
                <p className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(selected.calculatedFee)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-blue-600">Phí thực tế:</span>
                <p className="font-mono font-bold text-blue-600 text-lg">{formatCurrency(selected.actualFee)}</p>
              </div>
              <div>
                <span className="text-gray-500">Chênh lệch phí:</span>
                <p className="font-mono font-bold text-red-500">{formatCurrency(selected.discrepancy)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selected.status === 'DONG_BO' ? 'Đã đối soát & khớp phí' : 'Đang chờ Duyệt chi phụ phí'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú đối soát:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đối soát / điều chỉnh phí thực tế"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đơn hàng</label>
            <p className="font-semibold text-sm">{editingItem.customerName} ({editingItem.orderCode})</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phí thực tế giao hàng hãng thu (VND) *</label>
            <input
              type="number"
              value={editingItem.actualFee || 0}
              onChange={(e) => setEditingItem({ ...editingItem, actualFee: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái đối soát *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu kết quả
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeesPage;
