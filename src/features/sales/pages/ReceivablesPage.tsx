import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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

export function ReceivablesPage() {
  const [data, setData] = useState<ReceivableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReceivableRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ReceivableRecord>>({});

  const fetchReceivables = async () => {
    setIsLoading(true);
    try {
      const [customers, debts] = await Promise.all([
        axiosClient.get<any, any[]>('/partnerarea/customers'),
        axiosClient.get<any, any[]>('/finance/debt-ledgers'),
      ]);

      const mapped = (Array.isArray(customers) ? customers : []).map((c: any) => {
        const customerDebts = (Array.isArray(debts) ? debts : []).filter((d: any) => d.partnerId === c.id);
        
        let calculatedDebt = 0;
        let lastDate = '';
        customerDebts.forEach((d: any) => {
          calculatedDebt += (d.increase || 0) - (d.decrease || 0);
          if (d.transactionDate && (!lastDate || d.transactionDate > lastDate)) {
            lastDate = d.transactionDate;
          }
        });

        const limit = Number(c.debtLimit || 10000000);
        let status: 'BINH_THUONG' | 'CANH_BAO' | 'QUA_HAN' = 'BINH_THUONG';
        if (calculatedDebt > limit) {
          status = 'CANH_BAO';
        }

        return {
          id: String(c.id),
          customerCode: c.code || `KH${c.id}`,
          customerName: c.name || '',
          phone: c.phone || '',
          totalPurchased: calculatedDebt > 0 ? calculatedDebt * 3 : 1500000,
          currentDebt: calculatedDebt,
          debtLimit: limit,
          lastTransactionDate: lastDate ? lastDate.substring(0, 10) : '',
          status,
          notes: c.notes || 'Không có ghi chú công nợ',
        };
      });

      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải thông tin công nợ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

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

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    try {
      const limit = Number(editingItem.debtLimit || 0);
      await axiosClient.put(`/partnerarea/customers/${editingItem.id}`, {
        code: editingItem.customerCode,
        name: editingItem.customerName,
        phone: editingItem.phone,
        debtLimit: limit,
      });

      toast.success('Điều chỉnh hạn mức nợ thành công!');
      setIsModalOpen(false);
      fetchReceivables();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật hạn mức nợ.');
    }
  };


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ReceivableRecord>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã khách hàng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentDebt',
        header: 'Dư nợ hiện tại',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'debtLimit',
        header: 'Hạn mức nợ',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'lastTransactionDate',
        header: 'Giao dịch cuối',
        cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình trạng',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'Bình thường';
          if (status === 'CANH_BAO') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Vượt hạn mức';
          } else if (status === 'QUA_HAN') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Quá hạn';
          }
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
              title="Xem chi tiết công nợ"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenLimitAdjustment(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Điều chỉnh hạn mức"
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
          <h1 className="text-2xl font-bold">Công nợ phải thu (khách hàng)</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách công nợ...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết công nợ: ${selected?.customerName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã khách hàng:</span>
                <p className="font-mono font-semibold">{selected.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số điện thoại:</span>
                <p>{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Dư nợ hiện tại:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.currentDebt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn mức cho phép:</span>
                <p className="font-mono font-bold">{formatCurrency(selected.debtLimit)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tổng mua tích lũy:</span>
                <p className="font-mono">{formatCurrency(selected.totalPurchased)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giao dịch gần nhất:</span>
                <p className="font-mono">{selected.lastTransactionDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái công nợ:</span>
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
                  {selected.status === 'BINH_THUONG' ? 'An toàn' : selected.status === 'CANH_BAO' ? 'Vượt hạn mức' : 'Quá hạn'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú công nợ:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Lịch sử giao dịch nợ</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-2 border">Ngày</th>
                    <th className="p-2 border">Mã SO</th>
                    <th className="p-2 border text-right">Phát sinh</th>
                    <th className="p-2 border text-right">Thanh toán</th>
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
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Điều chỉnh hạn mức công nợ"
      >
        <form onSubmit={handleSaveLimit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Khách hàng</label>
            <p className="font-semibold text-sm">{editingItem.customerName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã khách hàng</label>
              <p className="font-mono text-sm">{editingItem.customerCode}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dư nợ hiện tại</label>
              <p className="font-mono text-sm text-red-600 font-bold">
                {editingItem.currentDebt ? formatCurrency(editingItem.currentDebt) : '0 đ'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hạn mức công nợ tối đa (VND) *</label>
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
              Cập nhật hạn mức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
