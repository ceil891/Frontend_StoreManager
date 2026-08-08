import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SalesPaymentRecord {
  id: string;
  paymentCode: string;
  invoiceCode: string;
  customerName: string;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE' | 'VI_DIEN_TU';
  paymentDate: string;
  amount: number;
  receiver: string;
  status: 'CHO_DUYET' | 'DA_THU' | 'DA_HUY';
  notes?: string;
}

export function SalesPaymentsPage() {
  const [data, setData] = useState<SalesPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesPaymentRecord>>({});

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/finance/order-payments');
      const mapped = (Array.isArray(res) ? res : []).map((p: any) => ({
        id: String(p.id),
        paymentCode: p.transactionRef || `PAY-${p.id}`,
        invoiceCode: p.invoice?.invoiceNumber || '',
        customerName: p.invoice?.customerId || 'Khách lẻ',
        paymentMethod: (p.paymentMethod?.methodCode === 'CASH' ? 'TIEN_MAT' : 'CHUYEN_KHOAN') as SalesPaymentRecord['paymentMethod'],
        paymentDate: p.paymentDate ? p.paymentDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        amount: p.amountPaid || 0,
        receiver: 'Nhân viên thanh toán',
        status: 'DA_THU' as SalesPaymentRecord['status'],
        notes: p.transactionRef || '',
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải lịch sử thanh toán.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.paymentCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.receiver.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      paymentCode: `PAY-SO-${Date.now().toString().slice(-4)}`,
      invoiceCode: '',
      customerName: '',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      receiver: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SalesPaymentRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.amount) return;

    try {
      const payload = {
        amountPaid: Number(editingItem.amount),
        transactionRef: editingItem.paymentCode,
      };

      if (modalMode === 'create') {
        await axiosClient.post('/finance/order-payments', payload);
        toast.success('Ghi nhận thanh toán thành công!');
      } else {
        toast.error('Cập nhật phiếu thanh toán không hỗ trợ trực tiếp.');
      }
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu thanh toán.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch thanh toán này?')) {
      try {
        await axiosClient.delete(`/finance/order-payments/${id}`);
        toast.success('Đã xóa giao dịch thanh toán!');
        fetchPayments();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa thanh toán.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SalesPaymentRecord>[]>(
    () => [
      {
        accessorKey: 'paymentCode',
        header: 'Mã phiếu thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Phương thức',
        cell: (info) => {
          const val = info.getValue() as string;
          const label = val === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : val === 'TIEN_MAT' ? 'Tiền mặt' : val === 'THE' ? 'Thẻ' : 'Ví điện tử';
          return <span className="text-gray-700 dark:text-gray-300">{label}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THU'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_DUYET'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THU' ? 'Đã thu' : status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã hủy';
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
          <h1 className="text-2xl font-bold">Thanh toán đơn bán (phiếu thu)</h1>
          <p className="text-sm text-gray-500">
            Quản lý các khoản thanh toán, giao dịch thu tiền từ khách hàng nhằm xác nhận doanh thu thực tế.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Thu Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu thu, mã hóa đơn, khách hàng, người thu..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải lịch sử thanh toán...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Thu: ${selected?.paymentCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu thu:</span>
                <p className="font-mono font-semibold text-emerald-600">{selected.paymentCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Số tiền thu:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Phương thức:</span>
                <p>
                  {selected.paymentMethod === 'CHUYEN_KHOAN'
                    ? 'Chuyển khoản'
                    : selected.paymentMethod === 'TIEN_MAT'
                    ? 'Tiền mặt'
                    : selected.paymentMethod === 'THE'
                    ? 'Thẻ'
                    : 'Ví điện tử'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày thu tiền:</span>
                <p className="font-mono">{selected.paymentDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Người thu / nhân viên:</span>
                <p>{selected.receiver || 'Chưa rõ'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_THU'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_THU' ? 'Đã thu' : selected.status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú:</span>
                <p className="mt-1 font-mono text-gray-800 dark:text-gray-200">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '💵 Tạo phiếu thu thanh toán đơn bán mới' : '⚙️ Sửa phiếu thu thanh toán'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã phiếu thu *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, paymentCode: `PAY-SO-${Date.now().toString().slice(-4)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.paymentCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã Hóa đơn / Đơn SO liên kết *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="INV-2026-XXX hoặc SO-XXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên khách hàng nộp tiền *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Nguyễn Văn A / Công ty X..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phân loại khoản thu *</label>
              <select
                value={(editingItem as any).receiptCategory || 'SALES_REVENUE'}
                onChange={(e) => setEditingItem({ ...editingItem, receiptCategory: e.target.value } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="SALES_REVENUE">Doanh thu bán hàng</option>
                <option value="DEBT_COLLECTION">Thu hồi công nợ khách hàng</option>
                <option value="DEPOSIT">Tiền đặt cọc đơn hàng</option>
                <option value="OTHER">Khoản thu khác</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số tiền thu (VND) *</label>
              <input
                type="number"
                value={editingItem.amount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, amount: Number(e.target.value) })}
                className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded font-mono bg-white dark:bg-gray-900 font-bold text-emerald-600 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phương thức thanh toán *</label>
              <select
                value={editingItem.paymentMethod || 'CHUYEN_KHOAN'}
                onChange={(e) => setEditingItem({ ...editingItem, paymentMethod: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="CHUYEN_KHOAN">🏦 Chuyển khoản ngân hàng</option>
                <option value="TIEN_MAT">💵 Tiền mặt tại quầy</option>
                <option value="THE">💳 Thẻ (Visa/Master/ATM)</option>
                <option value="VI_DIEN_TU">📲 Ví điện tử (Momo/VNPay/ZaloPay)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày hạch toán thu *</label>
              <input
                type="date"
                value={editingItem.paymentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thủ quỹ / Nhân viên thu tiền</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tên nhân viên thu tiền..."
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái hạch toán *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="CHO_DUYET">⏳ Chờ Kế toán duyệt</option>
              <option value="DA_THU">🟢 Đã Thu (Tiền đã vào tài khoản/quỹ)</option>
              <option value="DA_HUY">🔴 Đã hủy phiếu thu</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú & chứng từ kèm theo</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={3}
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
              Lưu phiếu thu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
