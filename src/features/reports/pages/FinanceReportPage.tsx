import { useMemo, useState } from 'react';
import { Download, Wallet, CreditCard, Activity, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// --- MOCK DATA ---
const FINANCE_DATA = [
  { month: 'T1', income: 400, expense: 240, profit: 160 },
  { month: 'T2', income: 300, expense: 139, profit: 161 },
  { month: 'T3', income: 200, expense: 980, profit: -780 },
  { month: 'T4', income: 278, expense: 390, profit: -112 },
  { month: 'T5', income: 189, expense: 480, profit: -291 },
  { month: 'T6', income: 239, expense: 380, profit: -141 },
  { month: 'T7', income: 349, expense: 430, profit: -81 },
];

interface ExpenseTransaction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'UNPAID';
}

const RECENT_EXPENSES: ExpenseTransaction[] = [
  { id: 'EXP-001', category: 'Tiền thuê mặt bằng', description: 'Thuê mặt bằng CH Quận 1 tháng 5', amount: 45000000, date: '01/05/2024', status: 'PAID' },
  { id: 'EXP-002', category: 'Tiền điện nước', description: 'Điện nước tháng 4', amount: 5200000, date: '05/05/2024', status: 'PAID' },
  { id: 'EXP-003', category: 'Lương nhân viên', description: 'Lương tháng 4/2024', amount: 120000000, date: '10/05/2024', status: 'UNPAID' },
  { id: 'EXP-004', category: 'Marketing', description: 'Quảng cáo Facebook', amount: 15000000, date: '12/05/2024', status: 'PAID' },
];

const KPI_CARDS = [
  { title: 'Tổng thu', value: '850.000.000đ', trend: '+15%', isUp: true, icon: Wallet, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-900/50' },
  { title: 'Tổng chi', value: '420.000.000đ', trend: '+5%', isUp: false, icon: CreditCard, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-900/50' },
  { title: 'Lợi nhuận gộp', value: '430.000.000đ', trend: '+25%', isUp: true, icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50' },
];

export function FinanceReportPage() {
  const [period, setPeriod] = useState('2024');

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
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString()}đ</span>,
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân tích Thu Chi và Lợi nhuận doanh nghiệp.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="2024">Năm 2024</option>
            <option value="2023">Năm 2023</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KPI_CARDS.map((kpi, idx) => (
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
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Biểu đồ thu chi & Lợi nhuận (triệu VNĐ)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={FINANCE_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" dark-stroke="#374151" opacity={0.5} />
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi phí gần đây</h3>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={RECENT_EXPENSES} />
      </div>
    </div>
  );
}
