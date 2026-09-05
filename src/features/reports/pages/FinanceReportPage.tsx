import { useMemo, useState, useEffect } from 'react';
import { 
  Download, Wallet, CreditCard, Activity, ArrowUpRight, ArrowDownRight, 
  FileText, Building2, Layers, Percent, Clock, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useFinanceStore } from '@/features/finance/store/financeStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { toast } from 'sonner';

interface ExpenseTransaction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'UNPAID';
}

interface PartialDebtItem {
  id: string;
  code: string;
  partner: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'PARTNER';
  referenceDoc: string;
  origAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPct: number;
  dueDate: string;
  status: string;
}

export function FinanceReportPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'debt'>('overview');
  const [period, setPeriod] = useState('2026');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const receipts = useFinanceStore((s) => s.receipts);
  const payments = useFinanceStore((s) => s.payments);
  const debts = useFinanceStore((s) => s.debts);
  const fetchReceipts = useFinanceStore((s) => s.fetchReceipts);
  const fetchPayments = useFinanceStore((s) => s.fetchPayments);
  const fetchDebts = useFinanceStore((s) => s.fetchDebts);

  const branches = useBranchStore((s) => s.branches);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);

  const [financeData, setFinanceData] = useState([
    { month: 'T1', income: 400, expense: 240, profit: 160 },
    { month: 'T2', income: 300, expense: 174, profit: 126 },
    { month: 'T3', income: 500, expense: 300, profit: 200 },
    { month: 'T4', income: 600, expense: 360, profit: 240 },
    { month: 'T5', income: 480, expense: 290, profit: 190 },
    { month: 'T6', income: 550, expense: 325, profit: 225 },
    { month: 'T7', income: 620, expense: 372, profit: 248 },
  ]);

  const [agingData, setAgingData] = useState([
    { ageGroup: '< 30 ngày', amount: 0, count: 0 },
    { ageGroup: '31 - 60 ngày', amount: 0, count: 0 },
    { ageGroup: '61 - 90 ngày', amount: 0, count: 0 },
    { ageGroup: '> 90 ngày', amount: 0, count: 0 },
  ]);

  useEffect(() => {
    fetchReceipts();
    fetchPayments();
    fetchDebts();
    fetchBranches();

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

    const fetchAging = async () => {
      try {
        const res = await axiosClient.get<any, any>('/finance/debt-ledgers/aging-summary');
        const data = res?.data || res;
        if (data) {
          setAgingData([
            { ageGroup: '< 30 ngày', amount: Math.round(Number(data.under30Days || 0) / 1000000), count: Number(data.under30Count || 0) },
            { ageGroup: '31 - 60 ngày', amount: Math.round(Number(data.days31To60 || 0) / 1000000), count: Number(data.days31To60Count || 0) },
            { ageGroup: '61 - 90 ngày', amount: Math.round(Number(data.days61To90 || 0) / 1000000), count: Number(data.days61To90Count || 0) },
            { ageGroup: '> 90 ngày', amount: Math.round(Number(data.over90Days || 0) / 1000000), count: Number(data.over90Count || 0) },
          ]);
        }
      } catch (e) {
        console.error('Failed to fetch aging summary:', e);
      }
    };

    fetchProfitLoss();
    fetchAging();
  }, [fetchReceipts, fetchPayments, fetchDebts, fetchBranches]);

  // Filter receipts & payments by selected branch
  const filteredReceipts = useMemo(() => {
    if (selectedBranch === 'all') return receipts;
    return receipts.filter((r: any) => !r.branchId || String(r.branchId) === String(selectedBranch));
  }, [receipts, selectedBranch]);

  const filteredPayments = useMemo(() => {
    if (selectedBranch === 'all') return payments;
    return payments.filter((p: any) => !p.branchId || String(p.branchId) === String(selectedBranch));
  }, [payments, selectedBranch]);

  const kpis = useMemo(() => {
    const totalReceiptAmt = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalPaymentAmt = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalIncome = totalReceiptAmt > 0 ? totalReceiptAmt : financeData.reduce((acc, curr) => acc + Number(curr.income), 0) * 1000000;
    const totalExpense = totalPaymentAmt > 0 ? totalPaymentAmt : financeData.reduce((acc, curr) => acc + Number(curr.expense), 0) * 1000000;
    const totalProfit = totalIncome - totalExpense;

    return [
      { title: 'Tổng thu (phiếu thu & bán hàng)', value: totalIncome.toLocaleString('vi-VN') + ' đ', trend: `${filteredReceipts.length} phiếu thu`, isUp: true, icon: Wallet, color: 'text-primary bg-primary/10 border-primary/20' },
      { title: 'Tổng chi (phiếu chi & giá vốn)', value: totalExpense.toLocaleString('vi-VN') + ' đ', trend: `${filteredPayments.length} phiếu chi`, isUp: false, icon: CreditCard, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-900/50' },
      { title: 'Lợi nhuận gộp', value: totalProfit.toLocaleString('vi-VN') + ' đ', trend: 'Lợi nhuận thuần', isUp: totalProfit >= 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50' },
    ];
  }, [filteredReceipts, filteredPayments, financeData]);

  // Debt KPIs
  const debtKpis = useMemo(() => {
    let customerTotal = 0;
    let supplierTotal = 0;
    let partialDebtTotal = 0;
    let partialCount = 0;
    let totalOrig = 0;
    let totalPaid = 0;

    debts.forEach((d) => {
      const bal = Math.abs(d.totalDebt || 0);
      const paid = d.paidAmount || d.decrease || 0;
      const orig = (d.increase || 0) > 0 ? d.increase! : (paid + bal);

      totalOrig += orig;
      totalPaid += paid;

      if (d.entityType === 'CUSTOMER') {
        customerTotal += bal;
      } else if (d.entityType === 'SUPPLIER') {
        supplierTotal += bal;
      }

      if ((d.status as any) === 'PARTIAL' || (paid > 0 && bal > 0)) {
        partialDebtTotal += bal;
        partialCount += 1;
      }
    });

    const netBalance = customerTotal - supplierTotal;
    const collectionRate = totalOrig > 0 ? Math.round((totalPaid / totalOrig) * 100) : 0;

    return {
      customerTotal,
      supplierTotal,
      netBalance,
      partialDebtTotal,
      partialCount,
      totalOrig,
      totalPaid,
      collectionRate,
    };
  }, [debts]);

  const recentExpenses = useMemo<ExpenseTransaction[]>(() => {
    return filteredPayments.map((p) => ({
      id: p.voucherNumber || (p as any).voucherCode || (p as any).code || `PAY-${p.id}`,
      category: p.category || 'Chi phí vận hành',
      description: p.notes || (p as any).reason || 'Phiếu chi hệ thống',
      amount: p.amount || 0,
      date: p.paymentDate ? p.paymentDate.slice(0, 10) : ((p as any).voucherDate ? String((p as any).voucherDate).slice(0, 10) : 'Gần đây'),
      status: (p.status === 'COMPLETED' ? 'PAID' : 'UNPAID'),
    }));
  }, [filteredPayments]);

  const partialDebtRows = useMemo<PartialDebtItem[]>(() => {
    return debts
      .filter((d) => {
        const bal = Math.abs(d.totalDebt || 0);
        const paid = d.paidAmount || d.decrease || 0;
        return (d.status as any) === 'PARTIAL' || (paid > 0 && bal > 0);
      })
      .map((d) => {
        const bal = Math.abs(d.totalDebt || 0);
        const paid = d.paidAmount || d.decrease || 0;
        const orig = (d.increase || 0) > 0 ? d.increase! : (paid + bal);
        const pct = orig > 0 ? Math.min(100, Math.round((paid / orig) * 100)) : 0;
        return {
          id: d.id,
          code: d.debtCode,
          partner: d.entityName,
          type: d.entityType,
          referenceDoc: d.referenceDoc || '-',
          origAmount: orig,
          paidAmount: paid,
          remainingAmount: bal,
          progressPct: pct,
          dueDate: d.dueDate || '-',
          status: d.status,
        };
      });
  }, [debts]);

  const columns = useMemo<ColumnDef<ExpenseTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã phiếu',
        cell: (info) => <span className="font-mono text-xs font-semibold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'date',
        header: 'Ngày lập',
        cell: (info) => <span className="text-gray-500 dark:text-gray-400 text-sm">{info.getValue() as string}</span>,
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
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

  const partialColumns = useMemo<ColumnDef<PartialDebtItem>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã số',
        cell: (info) => <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'referenceDoc',
        header: 'Chứng từ / Đơn hàng',
        cell: (info) => <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'partner',
        header: 'Đối tác',
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-gray-900 dark:text-white block">{row.original.partner}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              row.original.type === 'CUSTOMER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {row.original.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'origAmount',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-mono text-gray-900 dark:text-white font-medium">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'paidAmount',
        header: 'Đã thanh toán',
        cell: (info) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'progressPct',
        header: 'Tiến độ',
        cell: ({ row }) => {
          const pct = row.original.progressPct;
          return (
            <div className="w-24">
              <div className="text-[11px] font-mono text-gray-500 mb-0.5">{pct}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'remainingAmount',
        header: 'Còn nợ lại',
        cell: ({ row }) => {
          const amt = row.original.remainingAmount;
          const isCust = row.original.type === 'CUSTOMER';
          return (
            <span className={`font-mono font-bold ${isCust ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {isCust ? `+${amt.toLocaleString('vi-VN')} ₫` : `-${amt.toLocaleString('vi-VN')} ₫`}
            </span>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Hạn thanh toán',
        cell: (info) => <span className="text-xs font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Percent className="w-3 h-3" /> Trả 1 phần ({row.original.progressPct}%)
          </span>
        ),
      },
    ],
    []
  );

  const handleExport = () => {
    if (activeTab === 'overview') {
      exportToCsv('bao_cao_chi_phi', recentExpenses, [
        { header: 'Mã phiếu', accessor: r => r.id },
        { header: 'Ngày lập', accessor: r => r.date },
        { header: 'Loại chi phí', accessor: r => r.category },
        { header: 'Diễn giải', accessor: r => r.description },
        { header: 'Số tiền (VND)', accessor: r => r.amount },
        { header: 'Trạng thái', accessor: r => r.status },
      ]);
      toast.success('Đã xuất báo cáo chi phí dạng Excel/CSV!');
    } else {
      exportToCsv('bao_cao_thanh_toan_tung_phan', partialDebtRows, [
        { header: 'Mã số', accessor: r => r.code },
        { header: 'Chứng từ gốc', accessor: r => r.referenceDoc },
        { header: 'Đối tác', accessor: r => r.partner },
        { header: 'Phân loại', accessor: r => r.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp' },
        { header: 'Tổng giá trị (VND)', accessor: r => r.origAmount },
        { header: 'Đã thanh toán (VND)', accessor: r => r.paidAmount },
        { header: 'Tiến độ (%)', accessor: r => `${r.progressPct}%` },
        { header: 'Còn thiếu (VND)', accessor: r => r.remainingAmount },
        { header: 'Hạn thanh toán', accessor: r => r.dueDate },
      ]);
      toast.success('Đã xuất báo cáo công nợ & trả một phần dạng Excel/CSV!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo tài chính & Công nợ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Phân tích thu chi, lợi nhuận và giám sát chi tiết thanh toán một phần / công nợ toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 shadow-xs">
            <Building2 className="w-4 h-4 text-gray-500" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Toàn hệ thống (Tất cả chi nhánh)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-primary focus:border-primary"
          >
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          Tổng quan Thu - Chi - Lợi nhuận
        </button>
        <button
          onClick={() => setActiveTab('debt')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'debt'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Báo cáo Công nợ & Thanh toán từng phần
          {debtKpis.partialCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
              {debtKpis.partialCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    kpi.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {kpi.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {kpi.trend}
                  </div>
                </div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Biểu đồ thu chi & lợi nhuận (triệu VNĐ)</h3>
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
                  <Bar dataKey="income" name="Thu" fill="#0068FF" radius={[4, 4, 0, 0]} barSize={20} />
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
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi phí & phiếu chi ({recentExpenses.length} bản ghi)</h3>
              </div>
            </div>
            <ReusableDataTable columns={columns} data={recentExpenses} />
          </div>
        </>
      )}

      {/* TAB 2: DEBT & PARTIAL PAYMENTS */}
      {activeTab === 'debt' && (
        <>
          {/* 4 Thẻ KPI Công nợ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phải thu Khách hàng</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{debtKpis.customerTotal.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-xs text-gray-400 mt-1">Từ các hóa đơn bán hàng</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phải trả Nhà cung cấp</span>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                -{debtKpis.supplierTotal.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-xs text-gray-400 mt-1">Từ các đơn đặt hàng nhập kho</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Dư nợ ròng (Phải thu - Phải trả)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold font-mono ${debtKpis.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {debtKpis.netBalance >= 0 ? `+${debtKpis.netBalance.toLocaleString('vi-VN')} ₫` : `-${Math.abs(debtKpis.netBalance).toLocaleString('vi-VN')} ₫`}
              </p>
              <p className="text-xs text-gray-400 mt-1">Vị thế công nợ thuần</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Đang trả một phần ({debtKpis.partialCount} đơn)</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {debtKpis.partialDebtTotal.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-xs text-gray-400 mt-1">Tổng số tiền nợ còn lại chưa tất toán</p>
            </div>
          </div>

          {/* Phân tích tuổi nợ & Tỷ lệ thu hồi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Biểu đồ phân tích tuổi nợ */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Phân tích tuổi nợ (Debt Aging Analysis)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dư nợ theo thời gian đáo hạn (triệu VNĐ)</p>
                </div>
                <button
                  onClick={() => {
                    fetchDebts();
                    toast.success('Đã làm mới dữ liệu tuổi nợ!');
                  }}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                      formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} tr ₫`, 'Dư nợ']}
                    />
                    <Bar dataKey="amount" name="Dư nợ (triệu ₫)" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tỷ lệ thanh toán & Thu hồi */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Hiệu quả thu hồi nợ</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Tỷ lệ thanh toán lũy kế toàn hệ thống</p>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-36 h-36 rounded-full border-8 border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      {debtKpis.collectionRate}%
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Đã thanh toán</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng phát sinh:</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    {debtKpis.totalOrig.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Đã thanh toán:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {debtKpis.totalPaid.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dư nợ hiện hữu:</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                    {(debtKpis.customerTotal + debtKpis.supplierTotal).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng theo dõi các đơn thanh toán một phần */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Chi tiết đơn hàng & hóa đơn thanh toán từng phần ({partialDebtRows.length} bản ghi)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Theo dõi số tiền đã trả trước / trả góp và số nợ còn phải thu / phải trả theo từng chứng từ
                  </p>
                </div>
              </div>
            </div>

            {partialDebtRows.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Không có đơn hàng nào đang thanh toán dở dang</p>
                <p className="text-xs text-gray-400 mt-1">Tất cả các khoản công nợ phát sinh đã được tất toán hoặc chưa bắt đầu thanh toán.</p>
              </div>
            ) : (
              <ReusableDataTable columns={partialColumns} data={partialDebtRows} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
export default FinanceReportPage;
