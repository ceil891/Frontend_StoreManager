import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { axiosClient } from '@/shared/lib/axiosClient';

type Transaction = {
  id: string;
  date: string;
  code: string;
  account: string;
  description: string;
  amount: number;
  direction: 'IN' | 'OUT';
  source: 'POS' | 'ONLINE' | 'MANUAL' | 'AUTO';
  status: string;
};

const listOf = (response: any) => Array.isArray(response) ? response : (response?.content || response?.data || []);

export function AccountTransactionHistoryPage() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [receipts, payments, orders] = await Promise.allSettled([
      axiosClient.get('/finance/receipt-vouchers'),
      axiosClient.get('/finance/payment-vouchers'),
      axiosClient.get('/sales/orders'),
    ]);
    const next: Transaction[] = [];
    if (receipts.status === 'fulfilled') listOf(receipts.value).forEach((item: any) => next.push({
      id: `receipt-${item.id}`, date: item.voucherDate || item.createdAt || '', code: item.voucherCode || `PT-${item.id}`,
      account: item.fundAccountName || (item.paymentMethod === 'CASH' ? 'Quỹ tiền mặt' : 'Tài khoản ngân hàng'),
      description: item.notes || item.payerName || 'Phiếu thu', amount: Number(item.amount || 0), direction: 'IN',
      source: item.invoiceCode?.startsWith('ORD-POS') ? 'POS' : (item.invoiceCode?.startsWith('ONLINE') ? 'ONLINE' : 'MANUAL'), status: item.status || 'COMPLETED',
    }));
    if (payments.status === 'fulfilled') listOf(payments.value).forEach((item: any) => next.push({
      id: `payment-${item.id}`, date: item.voucherDate || item.createdAt || '', code: item.voucherCode || `PC-${item.id}`,
      account: item.fundAccountName || (item.paymentMethod === 'CASH' ? 'Quỹ tiền mặt' : 'Tài khoản ngân hàng'),
      description: item.notes || item.receiverName || 'Phiếu chi', amount: Number(item.amount || 0), direction: 'OUT',
      source: item.invoiceCode?.startsWith('ORD-POS') ? 'POS' : (item.invoiceCode?.startsWith('ONLINE') ? 'ONLINE' : 'MANUAL'), status: item.status || 'PENDING_APPROVAL',
    }));
    // Orders are shown as pending automatic receipts when no voucher has been created yet.
    if (orders.status === 'fulfilled') listOf(orders.value).filter((item: any) => item.orderOrigin === 'ONLINE' || String(item.orderCode || '').startsWith('ORD-POS'))
      .forEach((item: any) => next.push({
        id: `order-${item.id}`, date: item.orderDate || item.createdAt || '', code: item.orderCode || `ORD-${item.id}`,
        account: item.paymentMethodCode || 'Chưa chọn tài khoản', description: `Thu tự động từ đơn hàng ${item.orderCode || ''}`,
        amount: Number(item.paidAmount || 0), direction: 'IN', source: item.orderOrigin === 'ONLINE' ? 'ONLINE' : 'POS', status: item.paymentStatus || 'UNPAID',
      }));
    setRows(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const totalIn = useMemo(() => rows.filter(r => r.direction === 'IN').reduce((total, row) => total + row.amount, 0), [rows]);
  const totalOut = useMemo(() => rows.filter(r => r.direction === 'OUT').reduce((total, row) => total + row.amount, 0), [rows]);

  return <div className="space-y-5">
    <div className="flex justify-between items-start gap-4"><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử biến động tài khoản</h2><p className="text-sm text-gray-500 mt-1">Tổng hợp cộng/trừ từ phiếu thu, phiếu chi và đơn POS/online.</p></div><button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300"><RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /> Làm mới</button></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Tổng cộng</p><p className="text-xl font-bold text-emerald-700">+{totalIn.toLocaleString('vi-VN')} ₫</p></div><div className="rounded-xl bg-rose-50 p-4"><p className="text-xs text-rose-700">Tổng trừ</p><p className="text-xl font-bold text-rose-700">-{totalOut.toLocaleString('vi-VN')} ₫</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-600">Chênh lệch</p><p className="text-xl font-bold">{(totalIn - totalOut).toLocaleString('vi-VN')} ₫</p></div></div>
    <div className="overflow-x-auto border rounded-xl"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Ngày</th><th className="p-3">Chứng từ</th><th className="p-3">Nguồn</th><th className="p-3">Tài khoản / quỹ</th><th className="p-3">Diễn giải</th><th className="p-3 text-right">Biến động</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{rows.sort((a,b) => b.date.localeCompare(a.date)).map(row => <tr key={row.id} className="border-t"><td className="p-3">{row.date ? new Date(row.date).toLocaleDateString('vi-VN') : '—'}</td><td className="p-3 font-medium">{row.code}</td><td className="p-3">{row.source}</td><td className="p-3">{row.account}</td><td className="p-3">{row.description}</td><td className={`p-3 text-right font-bold ${row.direction === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{row.direction === 'IN' ? '+' : '-'}{row.amount.toLocaleString('vi-VN')} ₫</td><td className="p-3">{row.status}</td></tr>)}{!loading && rows.length === 0 && <tr><td className="p-6 text-center text-gray-500" colSpan={7}>Chưa có giao dịch.</td></tr>}</tbody></table></div>
  </div>;
}
