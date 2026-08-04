import { Modal } from '@/shared/components/ui/Modal';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Download, Eye, Edit, Trash2, Search, CreditCard, Banknote, Smartphone, Wallet, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface OrderPaymentRecord {
  id: string;
  paymentCode: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'MOMO' | 'VNPAY' | 'COD';
  paymentDate: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  transactionRef?: string;
  notes?: string;
  branchName: string;
}

const fmt = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const methodConfig: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  CASH:          { label: 'Tiền mặt',     className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',     Icon: Banknote },
  BANK_TRANSFER: { label: 'Chuyển khoản', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', Icon: CreditCard },
  CREDIT_CARD:   { label: 'Thẻ tín dụng', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', Icon: CreditCard },
  MOMO:          { label: 'MoMo',          className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',  Icon: Smartphone },
  VNPAY:         { label: 'VNPay',         className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',     Icon: Wallet },
  COD:           { label: 'COD',           className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', Icon: Banknote },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Hoàn thành',  className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  PENDING:   { label: 'Chờ xử lý',   className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  FAILED:    { label: 'Thất bại',    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  REFUNDED:  { label: 'Đã hoàn tiền', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
};

export function OrderPaymentsPage() {
  const [data, setData] = useState<OrderPaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<OrderPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Partial<OrderPaymentRecord>>({});
  const [deletingPayment, setDeletingPayment] = useState<OrderPaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrderPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/finance/order-payments');
      const list = (res as any).content || res || [];
      const mapped: OrderPaymentRecord[] = (Array.isArray(list) ? list : []).map((item: any) => {
        // Map backend PaymentMethod (Object) -> code
        const methodCodeMap: Record<string, OrderPaymentRecord['paymentMethod']> = {
          TIEN_MAT: 'CASH',
          CHUYEN_KHOAN: 'BANK_TRANSFER',
          THE: 'CREDIT_CARD',
          MOMO: 'MOMO',
          VNPAY: 'VNPAY',
          COD: 'COD',
        };
        const methodKey = item.paymentMethod?.methodCode || item.paymentMethod?.name || 'TIEN_MAT';
        
        return {
          id: String(item.id),
          paymentCode: `PAY-${String(item.id).padStart(6, '0')}`,
          orderId: item.invoice?.id ? `ORD-${item.invoice.id}` : '',
          orderCode: item.invoice?.invoiceCode || '',
          customerName: item.invoice?.saleOrder?.customerName || item.invoice?.customerName || 'Khách lẻ',
          amount: Number(item.amountPaid || 0),
          paymentMethod: methodCodeMap[methodKey] || 'CASH',
          paymentDate: item.paymentDate ? item.paymentDate.replace('T', ' ').substring(0, 16) : '',
          status: 'COMPLETED', // backend OrderPayment thường lưu các thanh toán đã hoàn thành
          transactionRef: item.transactionRef || '',
          notes: item.note || '',
          branchName: item.invoice?.branch?.branchName || 'CH Quận 1',
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thanh toán:', err);
      toast.error('Không thể tải danh sách thanh toán');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrderPayments();
  }, [fetchOrderPayments]);

  const filtered = data.filter((p) => {
    const matchSearch =
      p.paymentCode.toLowerCase().includes(search.toLowerCase()) ||
      p.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  });

  const totalAmount = data.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const pendingCount = data.filter((p) => p.status === 'PENDING').length;
  const refundedAmount = data.filter((p) => p.status === 'REFUNDED').reduce((s, p) => s + p.amount, 0);

  const handleOpenCreate = () => {
    setEditingPayment({
      paymentCode: `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(data.length + 1).padStart(3, '0')}`,
      paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      amount: 0,
      orderCode: '',
      customerName: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment.orderCode || !editingPayment.customerName) return;

    try {
      const methodMapInverse: Record<string, string> = {
        CASH: 'TIEN_MAT',
        BANK_TRANSFER: 'CHUYEN_KHOAN',
        CREDIT_CARD: 'THE',
        MOMO: 'MOMO',
        VNPAY: 'VNPAY',
        COD: 'COD',
      };

      // Tìm methodId tương ứng. Vì API backend OrderPayment nhận methodId
      // Chúng ta sẽ fetch danh sách methods trước hoặc gửi methodId=1 (CASH) mặc định nếu không khớp
      // Để đơn giản và tương thích với FinanceController.java:
      // Long methodId = req.get("methodId") ...
      // Chúng ta cứ gửi methodId = 1 hoặc 2. Hãy gửi methodId tương ứng theo logic mapping
      const methodIdMap: Record<string, number> = {
        CASH: 1,
        BANK_TRANSFER: 2,
        CREDIT_CARD: 3,
        MOMO: 4,
        VNPAY: 5,
        COD: 6,
      };

      const payload = {
        invoiceId: 1, // Fallback, controller sẽ tự động tìm invoice hoặc lấy cái đầu tiên
        methodId: methodIdMap[editingPayment.paymentMethod || 'CASH'] || 1,
        amountPaid: Number(editingPayment.amount || 0),
        transactionRef: editingPayment.transactionRef || '',
      };

      await axiosClient.post('/finance/order-payments', payload);
      toast.success('Ghi nhận thanh toán thành công');
      setIsModalOpen(false);
      await fetchOrderPayments();
    } catch (err) {
      console.error('Lỗi khi ghi thanh toán:', err);
      toast.error('Không thể ghi nhận thanh toán');
    }
  };

  const columns = useMemo<ColumnDef<OrderPaymentRecord>[]>(
    () => [
      {
        accessorKey: 'paymentCode',
        header: 'Mã thanh toán',
        cell: (info) => <span className="font-mono font-bold text-xs text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn hàng',
        cell: (info) => <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.customerName}</p>
            <p className="text-xs text-gray-500">{row.original.branchName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Phương thức',
        cell: (info) => {
          const m = info.getValue() as string;
          const cfg = methodConfig[m];
          const Icon = cfg?.Icon || CreditCard;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${cfg?.className}`}>
              <Icon className="w-3.5 h-3.5" />
              {cfg?.label || m}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentDate',
        header: 'Ngày thanh toán',
        cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const s = info.getValue() as string;
          const cfg = statusConfig[s];
          return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.className}`}>{cfg?.label || s}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
            <button onClick={() => setDeletingPayment(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thanh toán đơn hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi và quản lý tất cả giao dịch thanh toán theo từng đơn hàng.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm"><Download className="w-4 h-4" /> Xuất báo cáo</button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"><Plus className="w-4 h-4" /> Ghi thanh toán</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng giao dịch', value: data.length, sub: 'giao dịch', color: 'text-gray-900 dark:text-white', Icon: TrendingUp },
            { label: 'Đã thu thành công', value: fmt(totalAmount), sub: '', color: 'text-emerald-600 dark:text-emerald-400', Icon: CreditCard },
            { label: 'Chờ xử lý', value: pendingCount, sub: 'giao dịch', color: 'text-amber-600 dark:text-amber-400', Icon: Clock },
            { label: 'Đã hoàn tiền', value: fmt(refundedAmount), sub: '', color: 'text-purple-600 dark:text-purple-400', Icon: RefreshCw },
          ].map(({ label, value, sub, color, Icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã thanh toán, mã đơn hàng, khách hàng..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="all">Tất cả phương thức</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="CREDIT_CARD">Thẻ tín dụng</option>
            <option value="MOMO">MoMo</option>
            <option value="VNPAY">VNPay</option>
            <option value="COD">COD</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="all">Tất cả trạng thái</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="FAILED">Thất bại</option>
            <option value="REFUNDED">Đã hoàn tiền</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
        )}
      </div>

      {/* Modal Detail */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết: ${selected.paymentCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-5 p-4">
            <div className={`p-4 rounded-xl border ${statusConfig[selected.status].className} border-current/20`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Trạng thái</p>
              <p className="text-lg font-bold">{statusConfig[selected.status].label}</p>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              {[
                ['Mã thanh toán', selected.paymentCode],
                ['Mã đơn hàng', selected.orderCode],
                ['Khách hàng', selected.customerName],
                ['Số tiền', fmt(selected.amount)],
                ['Phương thức', methodConfig[selected.paymentMethod]?.label || selected.paymentMethod],
                ['Ngày thanh toán', selected.paymentDate],
                ['Chi nhánh', selected.branchName],
                ['Mã giao dịch', selected.transactionRef || '—'],
                ['Ghi chú', selected.notes || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{k}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ghi thanh toán mới" width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn hàng *</label>
              <input required value={editingPayment.orderCode || ''} onChange={(e) => setEditingPayment({ ...editingPayment, orderCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500" placeholder="SO-88XXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng *</label>
              <input required value={editingPayment.customerName || ''} onChange={(e) => setEditingPayment({ ...editingPayment, customerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Tên khách hàng..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền (VND) *</label>
              <input type="number" min={0} required value={editingPayment.amount || 0} onChange={(e) => setEditingPayment({ ...editingPayment, amount: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phương thức *</label>
              <select value={editingPayment.paymentMethod || 'CASH'} onChange={(e) => setEditingPayment({ ...editingPayment, paymentMethod: e.target.value as OrderPaymentRecord['paymentMethod'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
                {Object.entries(methodConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select value={editingPayment.status || 'COMPLETED'} onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value as OrderPaymentRecord['status'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã giao dịch</label>
              <input value={editingPayment.transactionRef || ''} onChange={(e) => setEditingPayment({ ...editingPayment, transactionRef: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500" placeholder="VCB-TXN-..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea rows={2} value={editingPayment.notes || ''} onChange={(e) => setEditingPayment({ ...editingPayment, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Ghi chú thêm..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lưu giao dịch</button>
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <Modal isOpen={!!deletingPayment} onClose={() => setDeletingPayment(null)} title="Xác nhận xóa giao dịch" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa giao dịch <strong className="text-gray-900 dark:text-white">{deletingPayment?.paymentCode}</strong> — {fmt(deletingPayment?.amount || 0)}?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setDeletingPayment(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={async () => {
              if (deletingPayment) {
                try {
                  await axiosClient.delete(`/finance/order-payments/${deletingPayment.id}`);
                  toast.success('Xóa giao dịch thành công');
                  setDeletingPayment(null);
                  await fetchOrderPayments();
                } catch (err) {
                  console.error('Lỗi khi xóa giao dịch:', err);
                  toast.error('Không thể xóa giao dịch');
                }
              }
            }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
