import { useMemo, useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, Users, Package, Search } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type SaleOrder, formatMoney } from '@/features/sales/store/salesStore';
import { resolveCustomerName } from '@/features/sales/store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { Building2 } from 'lucide-react';

interface SalesTransaction {
  id: string;
  customerName: string;
  store: string;
  amount: number;
  amountLabel: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  date: string;
}

interface CustomerProductSaleRecord {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  formattedAmount: string;
  date: string;
  channel: string;
}

/** Quy đổi về VND để tính KPI thống nhất (USD mock × 25000) */
function toVnd(order: SaleOrder): number {
  if (order.currency === 'VND') return order.totalAmount;
  return Math.round(order.totalAmount * 25000);
}

function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')} đ`;
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
  const branches = useBranchStore((s) => s.branches);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);

  const [dateRange, setDateRange] = useState('7d');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'customer_products'>('overview');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchSaleOrders();
    fetchCustomers();
    fetchBranches();
  }, [fetchSaleOrders, fetchCustomers, fetchBranches]);

  // Filter orders by selected branch
  const filteredSaleOrders = useMemo(() => {
    if (selectedBranch === 'all') return saleOrders;
    if (selectedBranch === 'online') {
      return saleOrders.filter((o) => o.origin === 'ONLINE' || (o.branchName && o.branchName.toLowerCase().includes('online')));
    }
    const branchObj = branches.find((b) => b.id === selectedBranch);
    const branchName = branchObj?.name?.toLowerCase() || '';
    return saleOrders.filter((o) => {
      const oBranchId = String(o.branchId || '');
      const oBranchName = (o.branchName || '').toLowerCase();
      return oBranchId === selectedBranch || (branchName && oBranchName.includes(branchName));
    });
  }, [saleOrders, selectedBranch, branches]);

  const paidOrCompleted = filteredSaleOrders.filter(
    (o) => o.status === 'COMPLETED' || (o.status === 'PENDING' && o.paymentStatus === 'PAID')
  );

  const totalRevenueVnd = paidOrCompleted.reduce((sum, o) => sum + toVnd(o), 0);
  const orderCount = filteredSaleOrders.length;
  const aovVnd = orderCount ? Math.round(totalRevenueVnd / Math.max(paidOrCompleted.length, 1)) : 0;

  const kpiCards = useMemo(
    () => [
      {
        title: 'Tổng doanh thu (ước tính)',
        value: formatVnd(totalRevenueVnd),
        trend: `${paidOrCompleted.length} đơn đã thu`,
        isUp: true,
        icon: DollarSign,
        color: 'text-primary bg-primary/10 border-primary/20',
      },
      {
        title: 'Số lượng đơn hàng',
        value: orderCount.toLocaleString('vi-VN'),
        trend: `${saleOrders.filter((o) => o.origin === 'POS').length} từ POS`,
        isUp: true,
        icon: ShoppingBag,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-900/50',
      },
      {
        title: 'Giá trị đơn trung bình (AOV)',
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
    filteredSaleOrders
      .filter((o) => (o.origin === 'POS' || o.origin === 'ONLINE') && o.itemsSummary)
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
  }, [filteredSaleOrders]);

  const recentTransactions = useMemo(
    () =>
      [...filteredSaleOrders]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
        .map((o) => orderToTransaction(o, resolveCustomerName(o.customerId, customers))),
    [filteredSaleOrders, customers]
  );

  // Detailed breakdown of products sold per customer purchase
  const customerProductSales = useMemo<CustomerProductSaleRecord[]>(() => {
    const records: CustomerProductSaleRecord[] = [];
    filteredSaleOrders.forEach((o) => {
      const custObj = customers.find(c => String(c.id) === String(o.customerId) || c.name === o.customerName);
      const cName = o.customerName || custObj?.name || resolveCustomerName(o.customerId, customers);
      const cPhone = custObj?.phone || 'Chưa cập nhật';
      const channel = o.branchName || (o.origin === 'POS' ? 'Quầy POS' : o.origin === 'ONLINE' ? 'Website Online' : 'Bán hàng');
      const orderDate = o.date ? o.date.slice(0, 16).replace('T', ' ') : 'Gần đây';

      if (o.itemsSummary && o.itemsSummary.trim() !== '') {
        const parts = o.itemsSummary.split(',');
        parts.forEach((part, pIdx) => {
          const match = part.match(/^(.*?)(?:×(\d+))?$/);
          const pName = match ? match[1].trim() : part.trim();
          const qty = match && match[2] ? parseInt(match[2], 10) : 1;
          const estPrice = Math.round(toVnd(o) / Math.max(parts.length * qty, 1));
          const totalPart = estPrice * qty;

          records.push({
            id: `${o.code}-item-${pIdx}`,
            orderCode: o.code,
            customerName: cName,
            customerPhone: cPhone,
            productName: pName || 'Sản phẩm bán lẻ',
            quantity: qty,
            unitPrice: estPrice,
            totalAmount: totalPart,
            formattedAmount: formatVnd(totalPart),
            date: orderDate,
            channel,
          });
        });
      } else {
        records.push({
          id: `${o.code}-total`,
          orderCode: o.code,
          customerName: cName,
          customerPhone: cPhone,
          productName: `Đơn hàng ${o.code}`,
          quantity: 1,
          unitPrice: toVnd(o),
          totalAmount: toVnd(o),
          formattedAmount: formatVnd(toVnd(o)),
          date: orderDate,
          channel,
        });
      }
    });
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }, [saleOrders, customers]);

  const filteredCustomerProductSales = useMemo(() => {
    if (!productSearch) return customerProductSales;
    const q = productSearch.toLowerCase();
    return customerProductSales.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.orderCode.toLowerCase().includes(q)
    );
  }, [customerProductSales, productSearch]);

  const columns = useMemo<ColumnDef<SalesTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã giao dịch',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Thời gian',
        cell: (info) => <span className="text-gray-500 dark:text-gray-400 text-sm">{info.getValue() as string}</span>,
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
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

  const productSaleColumns = useMemo<ColumnDef<CustomerProductSaleRecord>[]>(
    () => [
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn hàng',
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-primary">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.customerName}</p>
            <p className="text-xs text-gray-400 font-mono">{row.original.customerPhone}</p>
          </div>
        ),
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm đã mua',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng',
        cell: (info) => (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 font-mono">
            x{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Đơn giá',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
            {formatVnd(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'formattedAmount',
        header: 'Tổng tiền',
        cell: (info) => (
          <span className="font-bold text-primary font-mono text-sm">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'channel',
        header: 'Kênh bán',
        cell: (info) => <span className="text-xs text-gray-500 dark:text-gray-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'date',
        header: 'Thời gian',
        cell: (info) => <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{info.getValue() as string}</span>,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo bán hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dữ liệu đồng bộ từ đơn bán hàng, POS và hành vi mua sắm của khách hàng
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
              <option value="online">Website Online (FE_webOnline)</option>
            </select>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-primary focus:border-primary"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="ytd">Năm nay</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Tổng quan & doanh thu
        </button>
        <button
          onClick={() => setActiveTab('customer_products')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'customer_products'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Users className="w-4 h-4" />
          Sản phẩm bán theo khách hàng
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpiCards.map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Xu hướng doanh thu (nghìn VNĐ)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0068FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0068FF" stopOpacity={0} />
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
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0068FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="cost" name="Giá vốn (ước tính)" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
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
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0068FF' : '#60A5FA'} />
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
              <span className="text-xs text-gray-400">Nguồn: Đơn bán hàng</span>
            </div>
            <ReusableDataTable columns={columns} data={recentTransactions} />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng, số điện thoại, tên sản phẩm hoặc mã đơn hàng..."
              className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Báo cáo sản phẩm bán theo từng khách hàng</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bóc tách chi tiết từng sản phẩm khách hàng đã mua, số lượng, đơn giá và giá trị giao dịch</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full font-mono">
                {filteredCustomerProductSales.length} dòng dữ liệu
              </span>
            </div>
            <ReusableDataTable columns={productSaleColumns} data={filteredCustomerProductSales} />
          </div>
        </div>
      )}
    </div>
  );
}
export default SalesReportPage;
