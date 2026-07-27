import { useMemo, useState } from 'react';
import { Download, Users, UserPlus, Heart, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// --- MOCK DATA ---
const CUSTOMER_GROWTH_DATA = [
  { month: 'T1', newCustomer: 120, returningCustomer: 450 },
  { month: 'T2', newCustomer: 150, returningCustomer: 480 },
  { month: 'T3', newCustomer: 180, returningCustomer: 510 },
  { month: 'T4', newCustomer: 130, returningCustomer: 590 },
  { month: 'T5', newCustomer: 210, returningCustomer: 620 },
  { month: 'T6', newCustomer: 190, returningCustomer: 650 },
  { month: 'T7', newCustomer: 250, returningCustomer: 710 },
];

const CUSTOMER_TIERS = [
  { name: 'Thành viên Đồng', value: 4500, color: '#9CA3AF' },
  { name: 'Thành viên Bạc', value: 2100, color: '#94A3B8' },
  { name: 'Thành viên Vàng', value: 850, color: '#FBBF24' },
  { name: 'Khách VIP (kim Cương)', value: 150, color: '#818CF8' },
];

interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  tier: string;
  totalSpent: number;
  lastVisit: string;
}

const TOP_CUSTOMERS: TopCustomer[] = [
  { id: 'CUS-001', name: 'Nguyễn Văn A', phone: '0901xxx123', tier: 'Kim Cương', totalSpent: 125000000, lastVisit: 'Hôm nay' },
  { id: 'CUS-002', name: 'Trần thị B', phone: '0982xxx456', tier: 'Vàng', totalSpent: 85000000, lastVisit: 'Hôm qua' },
  { id: 'CUS-003', name: 'Lê Văn C', phone: '0913xxx789', tier: 'Vàng', totalSpent: 72000000, lastVisit: '3 ngày trước' },
  { id: 'CUS-004', name: 'Phạm thị D', phone: '0904xxx321', tier: 'Bạc', totalSpent: 45000000, lastVisit: '1 tuần trước' },
  { id: 'CUS-005', name: 'Hoàng Văn E', phone: '0975xxx654', tier: 'Đồng', totalSpent: 15000000, lastVisit: '1 tháng trước' },
];

const KPI_CARDS = [
  { title: 'Tổng Khách hàng', value: '7,600', trend: '+8%', isUp: true, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-900/50' },
  { title: 'Khách hàng mới (Tháng)', value: '250', trend: '+12%', isUp: true, icon: UserPlus, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50' },
  { title: 'Tỷ lệ quay lại (Retention)', value: '68.5%', trend: '-1.2%', isUp: false, icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-900/50' },
];

export function CrmReportPage() {
  const [period, setPeriod] = useState('6m');

  const columns = useMemo<ColumnDef<TopCustomer>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã KH',
        cell: (info) => <span className="font-mono text-xs font-semibold text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Khách hàng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'tier',
        header: 'Hạng thẻ',
        cell: (info) => {
          const tier = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                tier === 'Kim Cương' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                tier === 'Vàng' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                tier === 'Bạc' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {tier}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalSpent',
        header: 'Tổng chi tiêu',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString()}đ</span>,
      },
      {
        accessorKey: 'lastVisit',
        header: 'Lần cuối mua hàng',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo Khách hàng (CRM)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân tích hành vi, độ trung thành và phân khúc khách hàng.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="6m">6 tháng qua</option>
            <option value="1y">1 năm qua</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            Xuất data
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tăng trưởng khách hàng</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CUSTOMER_GROWTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" dark-stroke="#374151" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Area type="monotone" dataKey="returningCustomer" name="Khách cũ" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorReturn)" />
                <Area type="monotone" dataKey="newCustomer" name="Khách mới" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Phân bổ Hạng Thẻ</h3>
          <p className="text-sm text-gray-500 mb-6">Tỷ lệ khách hàng theo Tier</p>
          <div className="h-[250px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CUSTOMER_TIERS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {CUSTOMER_TIERS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => `${Number(value ?? 0).toLocaleString()} KH`}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {CUSTOMER_TIERS.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Khách hàng Chi tiêu Cao nhất</h3>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={TOP_CUSTOMERS} />
      </div>
    </div>
  );
}
