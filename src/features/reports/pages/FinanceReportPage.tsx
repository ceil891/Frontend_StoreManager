import { useMemo, useState, useEffect } from 'react';
import { Download, Wallet, CreditCard, Activity, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useFinanceStore } from '@/features/finance/store/financeStore';

interface ExpenseTransaction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'UNPAID';
}

export function FinanceReportPage() {
  const [period, setPeriod] = useState('2026');
  const receipts = useFinanceStore((s) => s.receipts);
  const payments = useFinanceStore((s) => s.payments);
  const fetchReceipts = useFinanceStore((s) => s.fetchReceipts);
  const fetchPayments = useFinanceStore((s) => s.fetchPayments);

  const [financeData, setFinanceData] = useState([
    { month: 'T1', income: 400, expense: 240, profit: 160 },
    { month: 'T2', income: 300, expense: 174, profit: 126 },
    { month: 'T3', income: 500, expense: 300, profit: 200 },
    { month: 'T4', income: 600, expense: 360, profit: 240 },
    { month: 'T5', income: 480, expense: 290, profit: 190 },
    { month: 'T6', income: 550, expense: 325, profit: 225 },
    { month: 'T7', income: 620, expense: 372, profit: 248 },
  ]);

  useEffect(() => {
    fetchReceipts();
    fetchPayments();

    const fetchProfitLoss = async () => {
      try {
        const res = await axiosClient.get<any, any>('/reports/profit-loss');
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setFinanceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profit loss report:', error);
      }
    };
    fetchProfitLoss();
  }, [fetchReceipts, fetchPayments]);

  const kpis = useMemo(() => {
    const totalReceiptAmt = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalPaymentAmt = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalIncome = totalReceiptAmt > 0 ? totalReceiptAmt : financeData.reduce((acc, curr) => acc + Number(curr.income), 0) * 1000000;
    const totalExpense = totalPaymentAmt > 0 ? totalPaymentAmt : financeData.reduce((acc, curr) => acc + Number(curr.expense), 0) * 1000000;
    const totalProfit = totalIncome - totalExpense;

    return [
      { title: 'Tổng thu (Phiếu thu & Bán hàng)', value: totalIncome.toLocaleString('vi-VN') + 'đ', trend: `${receipts.length} phiếu thu`, isUp: true, icon: Wallet, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-900/50' },
      { title: 'Tổng chi (Phiếu chi & Giá vốn)', value: totalExpense.toLocaleString('vi-VN') + 'đ', trend: `${payments.length} phiếu chi`, isUp: false, icon: CreditCard, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-900/50' },
      { title: 'Lợi nhuận gộp', value: totalProfit.toLocaleString('vi-VN') + 'đ', trend: 'Lợi nhuận thuần', isUp: totalProfit >= 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50' },
    ];
  }, [receipts, payments, financeData]);

  const recentExpenses = useMemo<ExpenseTransaction[]>(() => {
    return payments.map((p) => ({
      id: p.code || `PAY-${p.id}`,
      category: p.category || 'Chi phí vận hành',
      description: p.note || p.reason || 'Phiếu chi hệ thống',
      amount: p.amount || 0,
      date: p.date ? p.date.slice(0, 10) : 'Gần đây',
      status: (p.status === 'COMPLETED' || p.status === 'PAID' ? 'PAID' : 'UNPAID') as 'PAID' | 'UNPAID',
    }));
  }, [payments]);

  const columns = useMemo<ColumnDef<ExpenseTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã phiếu',
        cell: (info) => <span className="font-mono text-xs font-semibold text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'date',
        header: 'Ngày lập',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Loại chi phí',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Diễn giải',
        cell: (info) => <span className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-[200px] block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString('vi-VN')}đ</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo Tài chính</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân tích Thu Chi và Lợi nhuận doanh nghiệp theo số liệu thực tế.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                kpi.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {kpi.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Biểu đồ thu chi & Lợi nhuận (triệu VNĐ)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                cursor={{fill: 'transparent'}}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="income" name="Thu" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="Chi" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="profit" name="Lợi nhuận" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi phí & Phiếu chi ({recentExpenses.length} bản ghi)</h3>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={recentExpenses} />
      </div>
    </div>
  );
}
