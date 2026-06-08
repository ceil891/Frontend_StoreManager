import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ReceivableRecord {
  id: string;
  customerCode: string;
  customerName: string;
  phone: string;
  totalPurchased: number;
  currentDebt: number;
  debtLimit: number;
  lastTransactionDate: string;
  status: 'BINH_THUONG' | 'CANH_BAO' | 'QUA_HAN';
  notes?: string;
}

const MOCK_RECEIVABLES: ReceivableRecord[] = [
  {
    id: '1',
    customerCode: 'KH001',
    customerName: 'Nguyễn Văn A',
    phone: '0912345678',
    totalPurchased: 45000000,
    currentDebt: 3400000,
    debtLimit: 10000000,
    lastTransactionDate: '2026-06-04',
    status: 'BINH_THUONG',
    notes: 'Khách thanh toán đều đặn hàng tháng',
  },
  {
    id: '2',
    customerCode: 'KH002',
    customerName: 'Trần Thị B',
    phone: '0987654321',
    totalPurchased: 98000000,
    currentDebt: 25000000,
    debtLimit: 20000000,
    lastTransactionDate: '2026-05-15',
    status: 'CANH_BAO',
    notes: 'Đã vượt quá hạn mức nợ cho phép (20M)',
  },
  {
    id: '3',
    customerCode: 'KH003',
    customerName: 'Công Ty TNHH Thương Mại Hoàng Gia',
    phone: '0243999999',
    totalPurchased: 250000000,
    currentDebt: 15000000,
    debtLimit: 50000000,
    lastTransactionDate: '2026-04-10',
    status: 'QUA_HAN',
    notes: 'Nợ quá hạn hơn 45 ngày chưa thấy thanh toán đợt mới',
  },
];

export function ReceivablesPage() {
  const [data, setData] = useState<ReceivableRecord[]>(MOCK_RECEIVABLES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReceivableRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ReceivableRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.customerCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.phone.includes(q)
    );
  }, [search, data]);

  const handleOpenLimitAdjustment = (item: ReceivableRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    const limit = Number(editingItem.debtLimit || 0);
    setData(
      data.map((d) => {
        if (d.id === editingItem.id) {
          const status = d.currentDebt > limit ? 'CANH_BAO' : d.status;
          return { ...d, debtLimit: limit, status };
        }
        return d;
      })
    );
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ReceivableRecord>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã Khách Hàng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentDebt',
        header: 'Dư Nợ Hiện Tại',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'debtLimit',
        header: 'Hạn Mức Nợ',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'lastTransactionDate',
        header: 'Giao Dịch Cuối',
        cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình Trạng',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'Bình Thường';
          if (status === 'CANH_BAO') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Vượt Hạn Mức';
          } else if (status === 'QUA_HAN') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Quá Hạn';
          }
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
              title="Xem Chi Tiết Công Nợ"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenLimitAdjustment(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Điều Chỉnh Hạn Mức"
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
          <h1 className="text-2xl font-bold">Công Nợ Phải Thu (Khách Hàng)</h1>
          <p className="text-sm text-gray-500">
            Theo dõi nợ mua hàng của khách đối tác, đối chiếu hạn mức nợ, cảnh báo nợ xấu và quá hạn thanh toán.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã khách hàng, tên khách hàng, số điện thoại..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết công nợ: ${selected?.customerName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Khách Hàng:</span>
                <p className="font-mono font-semibold">{selected.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số Điện Thoại:</span>
                <p>{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Dư Nợ Hiện Tại:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.currentDebt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn Mức Cho Phép:</span>
                <p className="font-mono font-bold">{formatCurrency(selected.debtLimit)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tổng Mua Tích Lũy:</span>
                <p className="font-mono">{formatCurrency(selected.totalPurchased)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giao Dịch Gần Nhất:</span>
                <p className="font-mono">{selected.lastTransactionDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Công Nợ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'BINH_THUONG'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CANH_BAO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'BINH_THUONG' ? 'An Toàn' : selected.status === 'CANH_BAO' ? 'Vượt Hạn Mức' : 'Quá Hạn'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Công Nợ:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Lịch Sử Giao Dịch Nợ</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-2 border">Ngày</th>
                    <th className="p-2 border">Mã SO</th>
                    <th className="p-2 border text-right">Phát Sinh</th>
                    <th className="p-2 border text-right">Thanh Toán</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">2026-06-04</td>
                    <td className="p-2 border font-mono">SO-2026-001</td>
                    <td className="p-2 border text-right font-mono text-red-500">1.450.000 đ</td>
                    <td className="p-2 border text-right font-mono text-emerald-500">0 đ</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">2026-05-15</td>
                    <td className="p-2 border font-mono">SO-2025-998</td>
                    <td className="p-2 border text-right font-mono text-red-500">0 đ</td>
                    <td className="p-2 border text-right font-mono text-emerald-500">2.000.000 đ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Điều Chỉnh Hạn Mức Công Nợ"
      >
        <form onSubmit={handleSaveLimit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Khách Hàng</label>
            <p className="font-semibold text-sm">{editingItem.customerName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Khách Hàng</label>
              <p className="font-mono text-sm">{editingItem.customerCode}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dư Nợ Hiện Tại</label>
              <p className="font-mono text-sm text-red-600 font-bold">
                {editingItem.currentDebt ? formatCurrency(editingItem.currentDebt) : '0 đ'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hạn Mức Công Nợ Tối Đa (VND) *</label>
            <input
              type="number"
              value={editingItem.debtLimit || 0}
              onChange={(e) => setEditingItem({ ...editingItem, debtLimit: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
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
              Cập Nhật Hạn Mức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
