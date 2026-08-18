import { useMemo, useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type SaleOrder, formatMoney } from '@/features/sales/store/salesStore';
import { resolveCustomerName } from '@/features/sales/store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';

interface SalesTransaction {
  id: string;
  customerName: string;
  store: string;
  amount: number;
  amountLabel: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  date: string;
}

/** Quy đổi về VND để tính KPI thống nhất (USD mock × 25000) */
function toVnd(order: SaleOrder): number {
  if (order.currency === 'VND') return order.totalAmount;
  return Math.round(order.totalAmount * 25000);
}

function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}

function mapOrderStatus(status: SaleOrder['status']): SalesTransaction['status'] {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

function orderToTransaction(order: SaleOrder, customerName: string): SalesTransaction {
  const isVnd = order.currency === 'VND';
  return {
    id: order.code,
    customerName,
    store: order.branchName || (order.origin === 'POS' ? 'Quầy POS' : order.origin === 'ONLINE' ? 'Online' : 'Bán hàng thủ công'),
    amount: order.totalAmount,
    amountLabel: formatMoney(order.totalAmount, isVnd ? 'VND' : 'USD'),
    status: mapOrderStatus(order.status),
    date: order.date,
  };
}

export function SalesReportPage() {
  const saleOrders = useSalesStore((s) => s.saleOrders);
  const fetchSaleOrders = useSalesStore((s) => s.fetchSaleOrders);
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchSaleOrders();
    fetchCustomers();
  }, [fetchSaleOrders, fetchCustomers]);

  const paidOrCompleted = saleOrders.filter(
    (o) => o.status === 'COMPLETED' || (o.status === 'PENDING' && o.paymentStatus === 'PAID')
  );

  const totalRevenueVnd = paidOrCompleted.reduce((sum, o) => sum + toVnd(o), 0);
  const orderCount = saleOrders.length;
  const aovVnd = orderCount ? Math.round(totalRevenueVnd / Math.max(paidOrCompleted.length, 1)) : 0;

  const kpiCards = useMemo(
    () => [
      {
        title: 'Tổng Doanh Thu (ước tính)',
        value: formatVnd(totalRevenueVnd),
        trend: `${paidOrCompleted.length} đơn đã thu`,
        isUp: true,
        icon: DollarSign,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-900/50',
      },
      {
        title: 'Số đơn hàng',
        value: orderCount.toLocaleString('vi-VN'),
        trend: `${saleOrders.filter((o) => o.origin === 'POS').length} từ POS`,
        isUp: true,
        icon: ShoppingBag,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50',
      },
      {
        title: 'Giá trị đơn TB (AOV)',
        value: formatVnd(aovVnd),
        trend: 'Đơn đã thanh toán',
        isUp: aovVnd > 0,
        icon: TrendingUp,
        color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-900/50',
      },
    ],
    [totalRevenueVnd, orderCount, paidOrCompleted.length, saleOrders, aovVnd]
  );

  const revenueChartData = useMemo(() => {
    const buckets = new Map<string, number>();
    paidOrCompleted.forEach((o) => {
      const day = o.date.slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + toVnd(o));
    });
    const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
    const slice = dateRange === '30d' ? sorted.slice(-30) : sorted.slice(-7);
    return slice.map(([date, revenue]) => ({
      date: date.slice(5).replace('-', '/'),
      revenue: Math.round(revenue / 1000),
      cost: Math.round((revenue * 0.65) / 1000),
    }));
  }, [paidOrCompleted, dateRange]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>();
    saleOrders
      .filter((o) => o.origin === 'POS' && o.itemsSummary)
      .forEach((o) => {
        o.itemsSummary!.split(',').forEach((part) => {
          const name = part.replace(/×\d+$/, '').trim();
          if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
        });
      });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));
  }, [saleOrders]);

  const recentTransactions = useMemo(
    () =>
      [...saleOrders]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
        .map((o) => orderToTransaction(o, resolveCustomerName(o.customerId, customers))),
    [saleOrders]
  );

  const columns = useMemo<ColumnDef<SalesTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã GD',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Thời gian',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'store',
        header: 'Kênh',
        cell: (info) => <span className="text-gray-600 dark:text-gray-400 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amountLabel',
        header: 'Giá trị',
        cell: (info) => (
          <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {status === 'COMPLETED' ? 'Hoàn tất' : status === 'PENDING' ? 'Chờ xử lý' : 'Đã hủy'}
            </span>
          );
        },
      },
    ],
    []
  );

  const chartData = revenueChartData.length > 0 ? revenueChartData : [{ date: '—', revenue: 0, cost: 0 }];
  const barData = topProducts.length > 0 ? topProducts : [{ name: 'Chưa có dữ liệu POS', sales: 0 }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo Doanh thu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dữ liệu đồng bộ từ đơn bán hàng & POS ({saleOrders.length} đơn trong hệ thống).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="ytd">Năm nay</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  kpi.isUp
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {kpi.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Xu hướng Doanh thu (nghìn VNĐ)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="cost" name="Giá vốn (ước)" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top sản phẩm (từ POS)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }}
                  width={100}
                />
                <RechartsTooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" name="Lượt bán" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366F1' : '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Giao dịch gần đây</h3>
          <span className="text-xs text-gray-400">Nguồn: salesStore</span>
        </div>
        <ReusableDataTable columns={columns} data={recentTransactions} />
      </div>
    </div>
  );
}
