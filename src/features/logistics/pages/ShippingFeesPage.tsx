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
    return `${Number(val || 0).toLocaleString('vi-VN')} đ`;
  };

  const columns = useMemo<ColumnDef<ShippingFeeRecord>[]>(
    () => [
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn hàng',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị vận chuyển',
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
        cell: (info) => <span className="font-mono font-bold text-primary">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'discrepancy',
        header: 'Chênh lệch phí',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className={`font-mono font-semibold ${val > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
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
          const badgeClass = status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
          const label = status === 'DONG_BO' ? 'Đã đồng bộ' : 'Chờ duyệt chi';
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
              title="Xem chi tiết phí"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đối soát phí vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xem và thực hiện đối soát chi phí giao nhận thực tế từ các hãng vận chuyển ngoài so với chi phí tạm tính trên đơn hàng
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, hãng vận chuyển..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách đối soát phí...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Thông tin đối soát phí: ${selected?.orderCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 block mb-1">Mã đơn hàng:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.orderCode}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Hãng vận chuyển:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.carrierName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Khách hàng:</span>
              <p className="font-semibold text-base text-gray-900 dark:text-white">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-gray-500 block mb-1">Phí tạm tính:</span>
                <p className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(selected.calculatedFee)}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1 text-primary font-medium">Phí thực tế:</span>
                <p className="font-mono font-bold text-primary text-base">{formatCurrency(selected.actualFee)}</p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Chênh lệch phí:</span>
                <p className="font-mono font-bold text-red-500">{formatCurrency(selected.discrepancy)}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <span className="text-gray-500 block mb-1">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selected.status === 'DONG_BO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {selected.status === 'DONG_BO' ? 'Đã đối soát & khớp phí' : 'Đang chờ duyệt chi phụ phí'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-gray-500 block mb-1">Ghi chú đối soát:</span>
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
        title="Điều chỉnh phí vận chuyển thực tế"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn hàng</label>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{editingItem.customerName} ({editingItem.orderCode})</p>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Phí thực tế đơn vị giao hàng thu (đ) *</label>
            <input
              type="number"
              value={editingItem.actualFee || 0}
              onChange={(e) => setEditingItem({ ...editingItem, actualFee: Number(e.target.value) })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái đối soát *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
            >
              <option value="CHO_DUYET">Chờ duyệt chi (có chênh lệch)</option>
              <option value="DONG_BO">Đồng bộ khớp phí</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              rows={2}
              placeholder="Lý do chênh lệch phí..."
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
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingFeesPage;
